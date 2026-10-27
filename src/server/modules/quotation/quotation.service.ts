import Decimal from "decimal.js";
import { pool } from "@/server/db";
import { CreateQuotationInput, QuotationServiceItemInput } from "@/shared/schemas/quotation.schema";
import { CurrentActor } from "@/server/auth/types";
import { getFxRateToVnd } from "@/server/modules/supplier-pricing/rate-lookup.service";

export interface QuotationFinancialSummary {
  totalSellAmount: number;
  totalEstimatedBuy: number;
  totalWorstCaseBuy: number;
  estimatedGp: number;
  estimatedMarginPercent: number;
}

export interface ApprovalAuthorityResult {
  allowed: boolean;
  requiredRole: "PRICING_MANAGER" | "DIRECTOR";
  isBodEscalation: boolean;
  reason?: string;
}

/**
 * Ma trận Phân quyền Duyệt Báo giá theo Biên lợi nhuận (PR-05 Approval Matrix)
 * - Margin >= 15%: Trưởng phòng Định giá & Thương mại (PRICING_MANAGER) hoặc cấp cao hơn
 * - Margin 5% - 14.9%: Phó Giám Đốc Thương Mại (DIRECTOR)
 * - Margin < 5%: Bắt buộc Ban Giám Đốc (DIRECTOR) với cờ ngoại lệ phê duyệt đặc biệt (BOD Exception)
 * - SALES: Không có quyền phê duyệt
 */
export function evaluateApprovalAuthority(
  marginPercent: number,
  actorRole: string
): ApprovalAuthorityResult {
  const isBodEscalation = marginPercent < 5;
  const requiredRole = marginPercent >= 15 ? "PRICING_MANAGER" : "DIRECTOR";

  if (actorRole === "SALES" || actorRole === "OPERATIONS" || actorRole === "ACCOUNTANT") {
    return {
      allowed: false,
      requiredRole,
      isBodEscalation,
      reason: "Chuyên viên Kinh doanh / Tác nghiệp không có thẩm quyền phê duyệt báo giá thương mại.",
    };
  }

  if (actorRole === "PRICING_MANAGER") {
    if (marginPercent < 15) {
      return {
        allowed: false,
        requiredRole: "DIRECTOR",
        isBodEscalation,
        reason: `Báo giá có biên lợi nhuận ${marginPercent}% (< 15%). Theo ma trận phân quyền THILOGI, chỉ cấp Phó Giám Đốc Thương Mại (DIRECTOR) mới có thẩm quyền duyệt.`,
      };
    }
    return {
      allowed: true,
      requiredRole: "PRICING_MANAGER",
      isBodEscalation: false,
    };
  }

  if (actorRole === "DIRECTOR") {
    return {
      allowed: true,
      requiredRole: "DIRECTOR",
      isBodEscalation,
      reason: isBodEscalation
        ? "Phê duyệt ngoại lệ đặc biệt cấp Ban Giám Đốc (BOD Special Exception) cho biên lợi nhuận thấp < 5%."
        : undefined,
    };
  }

  return {
    allowed: false,
    requiredRole: "DIRECTOR",
    isBodEscalation: true,
    reason: "Tài khoản không có thẩm quyền phê duyệt báo giá.",
  };
}

/**
 * Tính toán số liệu tài chính P&L cho danh mục dịch vụ báo giá bằng Decimal.js
 * Đảm bảo độ chính xác tuyệt đối, không có sai số dấu phẩy động
 */
export function calculateQuotationFinancials(
  items: QuotationServiceItemInput[]
): QuotationFinancialSummary {
  let totalSell = new Decimal(0);
  let totalEstimatedBuy = new Decimal(0);
  let totalWorstCaseBuy = new Decimal(0);

  for (const item of items) {
    const qty = new Decimal(item.plannedQuantity || 1);
    const unitSell = new Decimal(item.unitSellPrice || 0);
    const unitBuy = new Decimal(item.unitBuyPrice || 0);
    const worstBuy = new Decimal(item.worstCaseBuyPrice || item.unitBuyPrice || 0);

    const itemSell = unitSell.mul(qty);
    const itemBuy = unitBuy.mul(qty);
    const itemWorst = worstBuy.mul(qty);

    totalSell = totalSell.add(itemSell);
    totalEstimatedBuy = totalEstimatedBuy.add(itemBuy);
    totalWorstCaseBuy = totalWorstCaseBuy.add(itemWorst);
  }

  const estimatedGp = totalSell.sub(totalEstimatedBuy);
  const marginPercent = totalSell.isZero()
    ? new Decimal(0)
    : estimatedGp.div(totalSell).mul(100);

  return {
    totalSellAmount: totalSell.toNumber(),
    totalEstimatedBuy: totalEstimatedBuy.toNumber(),
    totalWorstCaseBuy: totalWorstCaseBuy.toNumber(),
    estimatedGp: estimatedGp.toNumber(),
    estimatedMarginPercent: Number(marginPercent.toFixed(2)),
  };
}

/**
 * Lưu hoặc Cập nhật Báo giá Nháp (PR-04 & PR-05)
 * - Tách biệt Create Draft (chưa có quotationId) vs Update Draft (đã có quotationId)
 * - Server-Authoritative: đọc lại bảng giá road_rates & vendors, quy đổi ngoại tệ FX sang VND
 * - Khóa tính bất biến: Không cho phép sửa nếu đã bị khóa hoặc không ở trạng thái DRAFT
 */
export async function saveQuotationDraft(
  input: CreateQuotationInput,
  createdBy = "Pricing Specialist"
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Xác thực và tính toán Server-Authoritative cho từng dịch vụ với chuẩn hóa FX
    let serverTotalSell = new Decimal(0);
    let serverTotalBuy = new Decimal(0);
    let serverTotalWorstBuy = new Decimal(0);

    const verifiedItems = [];

    for (const item of input.items) {
      const itemQty = new Decimal(item.plannedQuantity || 1);
      const itemSellUnit = new Decimal(item.unitSellPrice || 0);
      const itemSellTotal = itemSellUnit.mul(itemQty);
      serverTotalSell = serverTotalSell.add(itemSellTotal);

      let verifiedBuyRateVnd = new Decimal(0);
      let verifiedWorstBuyVnd = new Decimal(0);
      let verifiedVendorId: string | null = null;
      let verifiedVendorName: string | null = null;
      let verifiedOriginalRate = new Decimal(0);
      let verifiedOriginalCurrency = "VND";
      let verifiedFxRate = 1.0;
      let validityStart: string | null = null;
      let validityEnd: string | null = null;

      // PR-04 & Blocker 4: Server tra cứu lại giá gốc từ PostgreSQL theo đúng ngữ cảnh, không tin client
      if (item.selectedBuyRateId) {
        // 1. Kiểm tra bảng giá đã chọn có đúng tuyến đường, thiết bị và còn hiệu lực không
        const selectedCheck = await client.query(
          `SELECT 
             r.rate_id, r.vendor_id, v.vendor_name, r.buy_rate, r.currency,
             lower(r.validity_range)::text as val_start,
             upper(r.validity_range)::text as val_end
           FROM road_rates r
           JOIN vendors v ON r.vendor_id = v.vendor_id
           WHERE r.rate_id = $1
             AND r.pickup_location_id = $2
             AND r.delivery_location_id = $3
             AND r.equipment_type = $4
             AND r.status = 'APPROVED'
             AND r.validity_range @> CURRENT_DATE`,
          [
            item.selectedBuyRateId,
            item.originLocationId,
            item.destinationLocationId,
            item.equipmentType,
          ]
        );

        if (selectedCheck.rows.length === 0) {
          throw new Error(
            `Bảng giá mua [${item.selectedBuyRateId}] không hợp lệ, đã hết hạn hoặc không khớp với tuyến đường [${item.originLocationId} -> ${item.destinationLocationId}] / loại thiết bị [${item.equipmentType}].`
          );
        }

        const selRow = selectedCheck.rows[0];
        verifiedOriginalRate = new Decimal(selRow.buy_rate);
        verifiedOriginalCurrency = (selRow.currency || "VND").toUpperCase();
        verifiedFxRate = getFxRateToVnd(verifiedOriginalCurrency);
        verifiedBuyRateVnd = verifiedOriginalRate.mul(verifiedFxRate);
        verifiedVendorId = selRow.vendor_id;
        verifiedVendorName = selRow.vendor_name;
        validityStart = selRow.val_start;
        validityEnd = selRow.val_end;

        // 2. Tính Worst-Case BUY thực thụ (lấy MAX quy đổi VND trong tất cả các nhà cung cấp hợp lệ cùng tuyến)
        const allCandidates = await client.query(
          `SELECT r.buy_rate, r.currency
           FROM road_rates r
           WHERE r.pickup_location_id = $1
             AND r.delivery_location_id = $2
             AND r.equipment_type = $3
             AND r.status = 'APPROVED'
             AND r.validity_range @> CURRENT_DATE`,
          [
            item.originLocationId,
            item.destinationLocationId,
            item.equipmentType,
          ]
        );

        let maxCandidateBuyVnd = verifiedBuyRateVnd;
        for (const cand of allCandidates.rows) {
          const candRate = new Decimal(cand.buy_rate);
          const candFx = getFxRateToVnd(cand.currency || "VND");
          const candVnd = candRate.mul(candFx);
          if (candVnd.gt(maxCandidateBuyVnd)) {
            maxCandidateBuyVnd = candVnd;
          }
        }
        verifiedWorstBuyVnd = maxCandidateBuyVnd;
      }

      const itemBuyTotal = verifiedBuyRateVnd.mul(itemQty);
      const itemWorstTotal = verifiedWorstBuyVnd.mul(itemQty);
      serverTotalBuy = serverTotalBuy.add(itemBuyTotal);
      serverTotalWorstBuy = serverTotalWorstBuy.add(itemWorstTotal);

      const itemGp = itemSellTotal.sub(itemBuyTotal);
      const itemMargin = itemSellTotal.isZero() ? new Decimal(0) : itemGp.div(itemSellTotal).mul(100);

      verifiedItems.push({
        item,
        itemQty,
        itemSellUnit,
        itemSellTotal,
        verifiedBuyRateVnd,
        verifiedWorstBuyVnd,
        verifiedOriginalRate,
        verifiedOriginalCurrency,
        verifiedFxRate,
        itemBuyTotal,
        itemWorstTotal,
        itemGp,
        itemMargin,
        verifiedVendorId,
        verifiedVendorName,
        validityStart,
        validityEnd,
      });
    }

    const estimatedGp = serverTotalSell.sub(serverTotalBuy);
    const estimatedMarginPercent = serverTotalSell.isZero()
      ? new Decimal(0)
      : estimatedGp.div(serverTotalSell).mul(100);

    let quotationId = input.quotationId;
    let quotationNo = "";

    // 2. Phân biệt Create Draft vs Update Draft (PR-05)
    if (quotationId) {
      // --- UPDATE DRAFT ---
      const existingQuote = await client.query(
        `SELECT quotation_id, quotation_no, status, immutable_locked 
         FROM customer_quotations 
         WHERE quotation_id = $1`,
        [quotationId]
      );

      if (existingQuote.rows.length === 0) {
        throw new Error("Không tìm thấy Báo giá để cập nhật.");
      }

      const qRow = existingQuote.rows[0];
      if (qRow.immutable_locked || qRow.status !== "DRAFT") {
        throw new Error(`Báo giá [${qRow.quotation_no}] hiện ở trạng thái ${qRow.status} hoặc đã bị khóa, không thể cập nhật nháp.`);
      }

      quotationNo = qRow.quotation_no;

      await client.query(
        `UPDATE customer_quotations SET
           customer_id = $1,
           region_id = $2,
           commodity_id = $3,
           total_sell_amount = $4,
           total_estimated_buy = $5,
           total_worst_case_buy = $6,
           estimated_gp = $7,
           estimated_margin_percent = $8,
           payment_terms_days = $9,
           updated_at = CURRENT_TIMESTAMP
         WHERE quotation_id = $10`,
        [
          input.customerId,
          input.regionId,
          input.commodityId || null,
          serverTotalSell.toNumber(),
          serverTotalBuy.toNumber(),
          serverTotalWorstBuy.toNumber(),
          estimatedGp.toNumber(),
          Number(estimatedMarginPercent.toFixed(2)),
          input.paymentTermsDays,
          quotationId,
        ]
      );

      // Xóa snapshot và các dòng dịch vụ cũ theo thứ tự an toàn để tránh lỗi Foreign Key
      await client.query("DELETE FROM quotation_buy_snapshots WHERE quotation_id = $1", [quotationId]);
      await client.query("DELETE FROM quotation_service_items WHERE quotation_id = $1", [quotationId]);
    } else {
      // --- CREATE NEW DRAFT ---
      // Sinh số báo giá có cấu trúc tuần tự từ PostgreSQL sequence
      let seqNum: number;
      try {
        const seqRes = await client.query("SELECT nextval('quotation_no_seq') as seq");
        seqNum = Number(seqRes.rows[0].seq);
      } catch {
        // Tự động khởi tạo sequence nếu chưa tồn tại trong PostgreSQL
        await client.query("CREATE SEQUENCE IF NOT EXISTS quotation_no_seq START WITH 10001;");
        const seqRes = await client.query("SELECT nextval('quotation_no_seq') as seq");
        seqNum = Number(seqRes.rows[0].seq);
      }

      quotationNo = `QT-${new Date().getFullYear()}-${String(seqNum).padStart(5, "0")}`;

      const quoteRes = await client.query(
        `INSERT INTO customer_quotations (
           quotation_no, version, customer_id, region_id, commodity_id,
           status, total_sell_amount, total_estimated_buy, total_worst_case_buy,
           estimated_gp, estimated_margin_percent, payment_terms_days,
           immutable_locked, created_by
         ) VALUES (
           $1, 1, $2, $3, $4,
           'DRAFT', $5, $6, $7,
           $8, $9, $10,
           false, $11
         ) RETURNING quotation_id;`,
        [
          quotationNo,
          input.customerId,
          input.regionId,
          input.commodityId || null,
          serverTotalSell.toNumber(),
          serverTotalBuy.toNumber(),
          serverTotalWorstBuy.toNumber(),
          estimatedGp.toNumber(),
          Number(estimatedMarginPercent.toFixed(2)),
          input.paymentTermsDays,
          createdBy,
        ]
      );

      quotationId = quoteRes.rows[0].quotation_id;
    }

    // 3. Lưu từng dòng dịch vụ con (quotation_service_items) & BUY Snapshots
    for (const vItem of verifiedItems) {
      const itemRes = await client.query(
        `INSERT INTO quotation_service_items (
           quotation_id, service_package, pricing_inclusion,
           origin_location_id, destination_location_id, equipment_type,
           planned_quantity, unit, unit_sell_price, total_sell_price,
           selected_buy_rate_id, estimated_buy_amount, worst_case_buy_amount,
           item_gp, item_margin_percent
         ) VALUES (
           $1, $2, $3,
           $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13,
           $14, $15
         ) RETURNING item_id;`,
        [
          quotationId,
          vItem.item.servicePackage,
          vItem.item.pricingInclusion,
          vItem.item.originLocationId,
          vItem.item.destinationLocationId,
          vItem.item.equipmentType,
          vItem.item.plannedQuantity,
          vItem.item.unit,
          vItem.itemSellUnit.toNumber(),
          vItem.itemSellTotal.toNumber(),
          vItem.item.selectedBuyRateId || null,
          vItem.itemBuyTotal.toNumber(),
          vItem.itemWorstTotal.toNumber(),
          vItem.itemGp.toNumber(),
          Number(vItem.itemMargin.toFixed(2)),
        ]
      );

      // PR-04: Lưu Snapshot với dữ liệu có thẩm quyền từ PostgreSQL kèm FX Rate
      if (vItem.item.selectedBuyRateId && vItem.verifiedVendorId) {
        await client.query(
          `INSERT INTO quotation_buy_snapshots (
             quotation_id, item_id, source_rate_id,
             vendor_id, vendor_name, rate_amount,
             original_currency, fx_rate_to_vnd, rate_amount_vnd,
             validity_start, validity_end
           ) VALUES (
             $1, $2, $3,
             $4, $5, $6,
             $7, $8, $9,
             COALESCE($10::date, CURRENT_DATE),
             COALESCE($11::date, CURRENT_DATE + INTERVAL '90 days')
           );`,
          [
            quotationId,
            itemRes.rows[0].item_id,
            vItem.item.selectedBuyRateId,
            vItem.verifiedVendorId,
            vItem.verifiedVendorName || "Nhà cung cấp đã duyệt",
            vItem.verifiedOriginalRate.toNumber(),
            vItem.verifiedOriginalCurrency,
            vItem.verifiedFxRate,
            vItem.itemBuyTotal.toNumber(),
            vItem.validityStart,
            vItem.validityEnd,
          ]
        );
      }
    }

    await client.query("COMMIT");
    return {
      success: true,
      quotationId: quotationId as string,
      quotationNo,
      financials: {
        totalSellAmount: serverTotalSell.toNumber(),
        totalEstimatedBuy: serverTotalBuy.toNumber(),
        totalWorstCaseBuy: serverTotalWorstBuy.toNumber(),
        estimatedGp: estimatedGp.toNumber(),
        estimatedMarginPercent: Number(estimatedMarginPercent.toFixed(2)),
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw new Error(`Lỗi giao dịch cơ sở dữ liệu khi lưu báo giá: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    client.release();
  }
}

/**
 * Trình duyệt Báo giá và Kích hoạt Trạng thái Chờ duyệt (PENDING_APPROVAL)
 */
export async function submitQuotationForApproval(
  quotationId: string,
  actor: CurrentActor
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, version, region_id, status, immutable_locked, estimated_margin_percent 
       FROM customer_quotations 
       WHERE quotation_id = $1`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Báo giá không tồn tại trong hệ thống." };
    }

    const currentQuote = quoteCheck.rows[0];

    // Kiểm tra Region Scope của người gửi duyệt
    if (!actor.regionScopes.includes("*") && !actor.regionScopes.includes(currentQuote.region_id)) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Từ chối phân quyền (403): Người dùng [${actor.fullName}] không có quyền trình duyệt báo giá thuộc phân vùng [${currentQuote.region_id}].`,
      };
    }

    if (currentQuote.status !== "DRAFT" || currentQuote.immutable_locked) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Không thể trình duyệt: Báo giá [${currentQuote.quotation_no}] hiện ở trạng thái ${currentQuote.status} hoặc đã bị khóa.`,
      };
    }

    // Quy tắc P0: Không cho submit nếu thiếu giá mua đầu vào (MISSING RATE)
    const checkRes = await client.query(
      `SELECT COUNT(*) as missing_count FROM quotation_service_items 
       WHERE quotation_id = $1 AND (selected_buy_rate_id IS NULL OR estimated_buy_amount = 0)`,
      [quotationId]
    );

    if (Number(checkRes.rows[0].missing_count) > 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "Không thể trình duyệt: Có dịch vụ chưa xác định hoặc thiếu giá mua đầu vào (MISSING RATE).",
      };
    }

    // Cập nhật trạng thái PENDING_APPROVAL
    const updateRes = await client.query(
      `UPDATE customer_quotations 
       SET status = 'PENDING_APPROVAL', updated_at = NOW() 
       WHERE quotation_id = $1 AND status = 'DRAFT' AND immutable_locked = false
       RETURNING quotation_id, quotation_no`,
      [quotationId]
    );

    if (updateRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Xung đột đồng thời: Báo giá đã được thay đổi bởi một tác vụ khác." };
    }

    // Ghi Audit Log
    await client.query(
      `INSERT INTO quotation_approval_log (
         quotation_id, version, action, actor_id, actor_name, comment, snapshot_margin_percent
       ) VALUES ($1, $2, 'SUBMITTED', $3, $4, $5, $6);`,
      [
        quotationId,
        currentQuote.version || 1,
        actor.userId,
        actor.fullName,
        `Trình thẩm định bởi [${actor.fullName} (${actor.role})]`,
        currentQuote.estimated_margin_percent || 0,
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Đã trình duyệt thành công Báo giá [${updateRes.rows[0].quotation_no}] sang Hội đồng Định giá phê duyệt.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: `Lỗi kết nối cơ sở dữ liệu khi trình duyệt: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    client.release();
  }
}

/**
 * Phê duyệt Báo giá (Approve) theo Ma trận Biên lợi nhuận (PR-05)
 */
export async function approveQuotation(
  quotationId: string,
  actor: CurrentActor,
  comment?: string
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, version, region_id, status, immutable_locked, estimated_margin_percent, created_by 
       FROM customer_quotations 
       WHERE quotation_id = $1`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Báo giá không tồn tại." };
    }

    const currentQuote = quoteCheck.rows[0];

    // Phải ở trạng thái PENDING_APPROVAL
    if (currentQuote.status !== "PENDING_APPROVAL") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Không thể phê duyệt: Báo giá hiện ở trạng thái [${currentQuote.status}], không phải PENDING_APPROVAL.`,
      };
    }

    // Kiểm tra Region Scope
    if (!actor.regionScopes.includes("*") && !actor.regionScopes.includes(currentQuote.region_id)) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Từ chối phân quyền (403): Người dùng [${actor.fullName}] không phụ trách phân vùng [${currentQuote.region_id}].`,
      };
    }

    // Kiểm tra nguyên tắc 4 mắt (Four-Eyes Principle): Người lập không được tự phê duyệt báo giá của chính mình
    if (
      actor.role !== "DIRECTOR" &&
      currentQuote.created_by &&
      (currentQuote.created_by.includes(actor.fullName) || currentQuote.created_by.includes(actor.userId))
    ) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Vi phạm nguyên tắc 4 mắt (Four-Eyes Principle): Bạn [${actor.fullName}] là người lập báo giá này nên không thể tự phê duyệt. Báo giá cần được thẩm định bởi cấp quản lý độc lập.`,
      };
    }

    // Kiểm tra Ma trận Phê duyệt dựa trên Margin %
    const margin = Number(currentQuote.estimated_margin_percent || 0);
    const authority = evaluateApprovalAuthority(margin, actor.role);

    if (!authority.allowed) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: authority.reason || "Bạn không đủ thẩm quyền phê duyệt báo giá này.",
      };
    }

    // Bắt buộc nhập lý do (Reason) khi biên lợi nhuận dưới mức chuẩn 15%
    if (margin < 15 && (!comment || comment.trim().length < 5)) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Biên lợi nhuận ${margin}% thấp hơn mức tiêu chuẩn (15%). Bắt buộc phải nhập Lý do phê duyệt ngoại lệ (tối thiểu 5 ký tự) để phục vụ giải trình kiểm toán.`,
      };
    }

    // Cập nhật APPROVED & Khóa Bất Biến (Immutable Locked)
    await client.query(
      `UPDATE customer_quotations 
       SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), immutable_locked = true, updated_at = NOW() 
       WHERE quotation_id = $2 AND status = 'PENDING_APPROVAL'`,
      [`${actor.fullName} (${actor.role})`, quotationId]
    );

    // Ghi Audit Log
    const auditComment = comment || authority.reason || `Phê duyệt chính thức bởi [${actor.fullName} - ${actor.role}]`;
    await client.query(
      `INSERT INTO quotation_approval_log (
         quotation_id, version, action, actor_id, actor_name, comment, snapshot_margin_percent
       ) VALUES ($1, $2, 'APPROVED', $3, $4, $5, $6);`,
      [
        quotationId,
        currentQuote.version || 1,
        actor.userId,
        actor.fullName,
        auditComment,
        margin,
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Báo giá [${currentQuote.quotation_no}] đã được PHÊ DUYỆT CHÍNH THỨC và KHÓA BẤT BIẾN (Immutable Locked).`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: `Lỗi cơ sở dữ liệu khi phê duyệt: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    client.release();
  }
}

/**
 * Từ chối Báo giá (Reject)
 */
export async function rejectQuotation(
  quotationId: string,
  actor: CurrentActor,
  comment: string
) {
  if (!comment || comment.trim().length === 0) {
    return { success: false, error: "Vui lòng nhập lý do từ chối báo giá." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, version, region_id, status, estimated_margin_percent 
       FROM customer_quotations 
       WHERE quotation_id = $1`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Báo giá không tồn tại." };
    }

    const currentQuote = quoteCheck.rows[0];

    if (currentQuote.status !== "PENDING_APPROVAL") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Không thể từ chối: Báo giá hiện ở trạng thái [${currentQuote.status}].`,
      };
    }

    // Kiểm tra Region Scope
    if (!actor.regionScopes.includes("*") && !actor.regionScopes.includes(currentQuote.region_id)) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Từ chối phân quyền (403): Người dùng [${actor.fullName}] không phụ trách phân vùng [${currentQuote.region_id}].`,
      };
    }

    // Kiểm tra vai trò người từ chối
    if (actor.role === "SALES" || actor.role === "OPERATIONS" || actor.role === "ACCOUNTANT") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Từ chối thẩm quyền: Vai trò [${actor.role}] không có quyền từ chối báo giá thương mại.`,
      };
    }

    await client.query(
      `UPDATE customer_quotations 
       SET status = 'REJECTED', updated_at = NOW() 
       WHERE quotation_id = $1 AND status = 'PENDING_APPROVAL'`,
      [quotationId]
    );

    await client.query(
      `INSERT INTO quotation_approval_log (
         quotation_id, version, action, actor_id, actor_name, comment, snapshot_margin_percent
       ) VALUES ($1, $2, 'REJECTED', $3, $4, $5, $6);`,
      [
        quotationId,
        currentQuote.version || 1,
        actor.userId,
        actor.fullName,
        comment,
        currentQuote.estimated_margin_percent || 0,
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Đã từ chối báo giá [${currentQuote.quotation_no}]. Lý do: "${comment}".`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: `Lỗi cơ sở dữ liệu khi từ chối: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    client.release();
  }
}

/**
 * Trả về Bản Nháp để chỉnh sửa (Return to Draft)
 */
export async function returnQuotationToDraft(
  quotationId: string,
  actor: CurrentActor,
  comment: string
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, version, region_id, status, estimated_margin_percent 
       FROM customer_quotations 
       WHERE quotation_id = $1`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Báo giá không tồn tại." };
    }

    const currentQuote = quoteCheck.rows[0];

    if (currentQuote.status !== "PENDING_APPROVAL") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Không thể trả về nháp: Báo giá hiện ở trạng thái [${currentQuote.status}].`,
      };
    }

    // Bắt buộc nhập lý do khi trả về nháp
    if (!comment || comment.trim().length === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "Vui lòng nhập lý do trả báo giá về bản nháp để nhân viên lập chỉnh sửa.",
      };
    }

    // Kiểm tra Region Scope
    if (!actor.regionScopes.includes("*") && !actor.regionScopes.includes(currentQuote.region_id)) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Từ chối phân quyền (403): Người dùng [${actor.fullName}] không phụ trách phân vùng [${currentQuote.region_id}].`,
      };
    }

    // Kiểm tra vai trò người trả về nháp
    if (actor.role === "SALES" || actor.role === "OPERATIONS" || actor.role === "ACCOUNTANT") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Từ chối thẩm quyền: Vai trò [${actor.role}] không có quyền trả báo giá về bản nháp.`,
      };
    }

    await client.query(
      `UPDATE customer_quotations 
       SET status = 'DRAFT', immutable_locked = false, updated_at = NOW() 
       WHERE quotation_id = $1 AND status = 'PENDING_APPROVAL'`,
      [quotationId]
    );

    await client.query(
      `INSERT INTO quotation_approval_log (
         quotation_id, version, action, actor_id, actor_name, comment, snapshot_margin_percent
       ) VALUES ($1, $2, 'RETURNED_FOR_REVISION', $3, $4, $5, $6);`,
      [
        quotationId,
        currentQuote.version || 1,
        actor.userId,
        actor.fullName,
        comment || "Yêu cầu chỉnh sửa lại cấu thành giá bán/chi phí mua",
        currentQuote.estimated_margin_percent || 0,
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Đã trả Báo giá [${currentQuote.quotation_no}] về trạng thái DRAFT để điều chỉnh.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: `Lỗi cơ sở dữ liệu khi trả về nháp: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    client.release();
  }
}

export interface QuotationListItem {
  quotationId: string;
  quotationNo: string;
  version: number;
  customerId: string;
  customerName: string;
  regionId: string;
  regionName: string;
  commodityName?: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  totalSellAmount: number;
  totalEstimatedBuy: number;
  estimatedGp: number;
  estimatedMarginPercent: number;
  paymentTermsDays: number;
  createdBy: string;
  createdAt: string;
  routeSummary?: string;
  equipmentType?: string;
  itemCount: number;
}

export interface QuotationSnapshotItem {
  snapshotId: string;
  itemId: string;
  sourceRateId: string;
  vendorId: string;
  vendorName: string;
  rateAmount: number;
  originalCurrency: string;
  fxRateToVnd: number;
  rateAmountVnd: number;
  validityStart: string;
  validityEnd: string;
  snapshotAt: string;
}

export interface QuotationApprovalLogItem {
  logId: string;
  version: number;
  action: string;
  actorId: string;
  actorName?: string;
  comment?: string;
  snapshotMarginPercent?: number;
  createdAt: string;
}

export interface QuotationDetailResponse {
  quote: {
    quotationId: string;
    quotationNo: string;
    version: number;
    customerId: string;
    customerName: string;
    taxCode?: string;
    regionId: string;
    regionName: string;
    commodityId?: string;
    commodityName?: string;
    status: string;
    totalSellAmount: number;
    totalEstimatedBuy: number;
    totalWorstCaseBuy: number;
    estimatedGp: number;
    estimatedMarginPercent: number;
    paymentTermsDays: number;
    immutableLocked: boolean;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
  };
  items: Array<{
    itemId: string;
    servicePackage: string;
    pricingInclusion: string;
    originLocationId: string;
    originName?: string;
    destinationLocationId: string;
    destinationName?: string;
    equipmentType: string;
    plannedQuantity: number;
    unit: string;
    unitSellPrice: number;
    totalSellPrice: number;
    selectedBuyRateId?: string;
    estimatedBuyAmount: number;
    worstCaseBuyAmount: number;
    itemGp: number;
    itemMarginPercent: number;
  }>;
  snapshots: QuotationSnapshotItem[];
  approvalLogs: QuotationApprovalLogItem[];
}

/**
 * Lấy danh sách Báo giá từ PostgreSQL phục vụ Quotation List & Approval Worklist
 */
export async function getQuotationsList(filters?: {
  status?: string;
  regionId?: string;
  search?: string;
  limit?: number;
}): Promise<QuotationListItem[]> {
  let query = `
    SELECT 
      q.quotation_id as "quotationId",
      q.quotation_no as "quotationNo",
      q.version,
      q.customer_id as "customerId",
      c.customer_name as "customerName",
      q.region_id as "regionId",
      r.name as "regionName",
      cm.name as "commodityName",
      q.status,
      q.total_sell_amount as "totalSellAmount",
      q.total_estimated_buy as "totalEstimatedBuy",
      q.estimated_gp as "estimatedGp",
      q.estimated_margin_percent as "estimatedMarginPercent",
      q.payment_terms_days as "paymentTermsDays",
      q.created_by as "createdBy",
      q.created_at as "createdAt",
      (SELECT COUNT(*) FROM quotation_service_items WHERE quotation_id = q.quotation_id) as "itemCount",
      (SELECT CONCAT(COALESCE(orig.name, 'Điểm đi'), ' → ', COALESCE(dest.name, 'Điểm đến'))
       FROM quotation_service_items si
       LEFT JOIN locations orig ON si.origin_location_id = orig.location_id
       LEFT JOIN locations dest ON si.destination_location_id = dest.location_id
       WHERE si.quotation_id = q.quotation_id
       ORDER BY si.created_at ASC LIMIT 1) as "routeSummary",
      (SELECT si.equipment_type
       FROM quotation_service_items si
       WHERE si.quotation_id = q.quotation_id
       ORDER BY si.created_at ASC LIMIT 1) as "equipmentType"
    FROM customer_quotations q
    LEFT JOIN customers c ON q.customer_id = c.customer_id
    LEFT JOIN regions r ON q.region_id = r.region_id
    LEFT JOIN commodities cm ON q.commodity_id = cm.commodity_id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.status && filters.status !== "ALL") {
    params.push(filters.status);
    query += ` AND q.status = $${params.length}`;
  }
  if (filters?.regionId && filters.regionId !== "ALL") {
    params.push(filters.regionId);
    query += ` AND q.region_id = $${params.length}`;
  }
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (q.quotation_no ILIKE $${params.length} OR c.customer_name ILIKE $${params.length} OR cm.name ILIKE $${params.length})`;
  }

  const limit = filters?.limit ?? 250;
  params.push(limit);
  query += ` ORDER BY q.created_at DESC LIMIT $${params.length}`;

  const { rows } = await pool.query(query, params);
  return rows.map((r) => ({
    quotationId: r.quotationId,
    quotationNo: r.quotationNo,
    version: Number(r.version || 1),
    customerId: r.customerId,
    customerName: r.customerName || r.customerId,
    regionId: r.regionId,
    regionName: r.regionName || r.regionId,
    commodityName: r.commodityName || undefined,
    status: r.status,
    totalSellAmount: Number(r.totalSellAmount || 0),
    totalEstimatedBuy: Number(r.totalEstimatedBuy || 0),
    estimatedGp: Number(r.estimatedGp || 0),
    estimatedMarginPercent: Number(r.estimatedMarginPercent || 0),
    paymentTermsDays: Number(r.paymentTermsDays || 30),
    createdBy: r.createdBy || "System",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    routeSummary: r.routeSummary || undefined,
    equipmentType: r.equipmentType || undefined,
    itemCount: Number(r.itemCount || 0),
  }));
}

/**
 * Lấy chi tiết Báo giá kèm các dòng dịch vụ, snapshots và approval log
 */
export async function getQuotationDetail(quotationId: string): Promise<QuotationDetailResponse | null> {
  const quoteRes = await pool.query(
    `SELECT 
       q.quotation_id as "quotationId",
       q.quotation_no as "quotationNo",
       q.version,
       q.customer_id as "customerId",
       c.customer_name as "customerName",
       c.tax_code as "taxCode",
       q.region_id as "regionId",
       r.name as "regionName",
       q.commodity_id as "commodityId",
       cm.name as "commodityName",
       q.status,
       q.total_sell_amount as "totalSellAmount",
       q.total_estimated_buy as "totalEstimatedBuy",
       q.total_worst_case_buy as "totalWorstCaseBuy",
       q.estimated_gp as "estimatedGp",
       q.estimated_margin_percent as "estimatedMarginPercent",
       q.payment_terms_days as "paymentTermsDays",
       q.immutable_locked as "immutableLocked",
       q.created_by as "createdBy",
       q.approved_by as "approvedBy",
       q.approved_at as "approvedAt",
       q.created_at as "createdAt"
     FROM customer_quotations q
     LEFT JOIN customers c ON q.customer_id = c.customer_id
     LEFT JOIN regions r ON q.region_id = r.region_id
     LEFT JOIN commodities cm ON q.commodity_id = cm.commodity_id
     WHERE q.quotation_id = $1`,
    [quotationId]
  );
  if (quoteRes.rows.length === 0) return null;
  const quote = quoteRes.rows[0];

  const itemsRes = await pool.query(
    `SELECT 
       i.item_id as "itemId",
       i.service_package as "servicePackage",
       i.pricing_inclusion as "pricingInclusion",
       i.origin_location_id as "originLocationId",
       orig.name as "originName",
       i.destination_location_id as "destinationLocationId",
       dest.name as "destinationName",
       i.equipment_type as "equipmentType",
       i.planned_quantity as "plannedQuantity",
       i.unit,
       i.unit_sell_price as "unitSellPrice",
       i.total_sell_price as "totalSellPrice",
       i.selected_buy_rate_id as "selectedBuyRateId",
       i.estimated_buy_amount as "estimatedBuyAmount",
       i.worst_case_buy_amount as "worstCaseBuyAmount",
       i.item_gp as "itemGp",
       i.item_margin_percent as "itemMarginPercent"
     FROM quotation_service_items i
     LEFT JOIN locations orig ON i.origin_location_id = orig.location_id
     LEFT JOIN locations dest ON i.destination_location_id = dest.location_id
     WHERE i.quotation_id = $1
     ORDER BY i.created_at ASC`,
    [quotationId]
  );

  const snapshotsRes = await pool.query(
    `SELECT 
       snapshot_id as "snapshotId",
       item_id as "itemId",
       source_rate_id as "sourceRateId",
       vendor_id as "vendorId",
       vendor_name as "vendorName",
       rate_amount as "rateAmount",
       original_currency as "originalCurrency",
       fx_rate_to_vnd as "fxRateToVnd",
       rate_amount_vnd as "rateAmountVnd",
       validity_start as "validityStart",
       validity_end as "validityEnd",
       snapshot_at as "snapshotAt"
     FROM quotation_buy_snapshots
     WHERE quotation_id = $1
     ORDER BY snapshot_at ASC`,
    [quotationId]
  );

  const logsRes = await pool.query(
    `SELECT 
       log_id as "logId",
       version,
       action,
       actor_id as "actorId",
       actor_name as "actorName",
       comment,
       snapshot_margin_percent as "snapshotMarginPercent",
       created_at as "createdAt"
     FROM quotation_approval_log
     WHERE quotation_id = $1
     ORDER BY created_at DESC`,
    [quotationId]
  );

  return {
    quote: {
      quotationId: quote.quotationId,
      quotationNo: quote.quotationNo,
      version: Number(quote.version || 1),
      customerId: quote.customerId,
      customerName: quote.customerName || quote.customerId,
      taxCode: quote.taxCode || undefined,
      regionId: quote.regionId,
      regionName: quote.regionName || quote.regionId,
      commodityId: quote.commodityId || undefined,
      commodityName: quote.commodityName || undefined,
      status: quote.status,
      totalSellAmount: Number(quote.totalSellAmount || 0),
      totalEstimatedBuy: Number(quote.totalEstimatedBuy || 0),
      totalWorstCaseBuy: Number(quote.totalWorstCaseBuy || 0),
      estimatedGp: Number(quote.estimatedGp || 0),
      estimatedMarginPercent: Number(quote.estimatedMarginPercent || 0),
      paymentTermsDays: Number(quote.paymentTermsDays || 30),
      immutableLocked: Boolean(quote.immutableLocked),
      createdBy: quote.createdBy || "System",
      approvedBy: quote.approvedBy || undefined,
      approvedAt: quote.approvedAt ? new Date(quote.approvedAt).toISOString() : undefined,
      createdAt: quote.createdAt ? new Date(quote.createdAt).toISOString() : new Date().toISOString(),
    },
    items: itemsRes.rows.map((r) => ({
      itemId: r.itemId,
      servicePackage: r.servicePackage,
      pricingInclusion: r.pricingInclusion,
      originLocationId: r.originLocationId,
      originName: r.originName || undefined,
      destinationLocationId: r.destinationLocationId,
      destinationName: r.destinationName || undefined,
      equipmentType: r.equipmentType,
      plannedQuantity: Number(r.plannedQuantity || 1),
      unit: r.unit,
      unitSellPrice: Number(r.unitSellPrice || 0),
      totalSellPrice: Number(r.totalSellPrice || 0),
      selectedBuyRateId: r.selectedBuyRateId || undefined,
      estimatedBuyAmount: Number(r.estimatedBuyAmount || 0),
      worstCaseBuyAmount: Number(r.worstCaseBuyAmount || 0),
      itemGp: Number(r.itemGp || 0),
      itemMarginPercent: Number(r.itemMarginPercent || 0),
    })),
    snapshots: snapshotsRes.rows.map((r) => ({
      snapshotId: r.snapshotId,
      itemId: r.itemId,
      sourceRateId: r.sourceRateId,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      rateAmount: Number(r.rateAmount || 0),
      originalCurrency: r.originalCurrency,
      fxRateToVnd: Number(r.fxRateToVnd || 1),
      rateAmountVnd: Number(r.rateAmountVnd || 0),
      validityStart: r.validityStart ? new Date(r.validityStart).toISOString().split("T")[0] : "",
      validityEnd: r.validityEnd ? new Date(r.validityEnd).toISOString().split("T")[0] : "",
      snapshotAt: r.snapshotAt ? new Date(r.snapshotAt).toISOString() : "",
    })),
    approvalLogs: logsRes.rows.map((r) => ({
      logId: r.logId,
      version: Number(r.version || 1),
      action: r.action,
      actorId: r.actorId,
      actorName: r.actorName || undefined,
      comment: r.comment || undefined,
      snapshotMarginPercent: r.snapshotMarginPercent != null ? Number(r.snapshotMarginPercent) : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    })),
  };
}
