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

      // PR-04: Server tra cứu lại giá gốc từ PostgreSQL, quy đổi FX về VND, không tin client
      if (item.selectedBuyRateId) {
        const rateCheck = await client.query(
          `SELECT 
             r.rate_id, r.vendor_id, v.vendor_name, r.buy_rate, r.currency,
             lower(r.validity_range)::text as val_start,
             upper(r.validity_range)::text as val_end
           FROM road_rates r
           JOIN vendors v ON r.vendor_id = v.vendor_id
           WHERE r.rate_id = $1 AND r.status = 'APPROVED'`,
          [item.selectedBuyRateId]
        );

        if (rateCheck.rows.length > 0) {
          const row = rateCheck.rows[0];
          verifiedOriginalRate = new Decimal(row.buy_rate);
          verifiedOriginalCurrency = (row.currency || "VND").toUpperCase();
          verifiedFxRate = getFxRateToVnd(verifiedOriginalCurrency);
          verifiedBuyRateVnd = verifiedOriginalRate.mul(verifiedFxRate);
          verifiedWorstBuyVnd = verifiedBuyRateVnd;
          verifiedVendorId = row.vendor_id;
          verifiedVendorName = row.vendor_name;
          validityStart = row.val_start;
          validityEnd = row.val_end;
        }
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

      // Xóa các dòng dịch vụ cũ để tái đồng bộ
      await client.query("DELETE FROM quotation_service_items WHERE quotation_id = $1", [quotationId]);
    } else {
      // --- CREATE NEW DRAFT ---
      // Sinh số báo giá có cấu trúc tuần tự
      let seqNum = 10001;
      try {
        const seqRes = await client.query("SELECT nextval('quotation_no_seq') as seq");
        if (seqRes.rows.length > 0) {
          seqNum = Number(seqRes.rows[0].seq);
        }
      } catch {
        // Fallback an toàn nếu sequence chưa được khởi tạo
        seqNum = Math.floor(10000 + Math.random() * 90000);
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
      `SELECT quotation_id, quotation_no, version, region_id, status, immutable_locked, estimated_margin_percent 
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

    if (actor.role === "SALES") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "Chuyên viên Kinh doanh không có quyền từ chối báo giá của Hội đồng.",
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
