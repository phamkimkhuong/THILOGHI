"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { usePermission } from "@/components/auth/permission-guard";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getQuotationMasterDataAction,
  getQuotationDetailAction,
  lookupRoadRatesAction,
  saveDraftQuotationAction,
  approveQuotationAction,
  rejectQuotationAction,
  returnQuotationToDraftAction,
} from "@/features/quotation/actions";
import { createQuotationVersionAction } from "@/features/quotation/phase4-actions";
import { restoreQuotationItems, type ServiceItemState } from "@/features/quotation/editor-state";
import { commercialFingerprint, emptyServiceItem, rateWarning } from "@/features/quotation/workspace-state";
import { evaluateApprovalAuthority, isQuotationAuthor } from "@/features/quotation/approval-policy";
import { calculateQuotationFinancials, getBusinessDate } from "@/shared/utils/pricing";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { createQuotationSchema, type ServicePackage } from "@/shared/schemas/quotation.schema";
import type { QuotationDetailResponse } from "@/server/modules/quotation/quotation.service";

import { QuotationHeaderBar } from "./_components/quotation-header-bar";
import { QuotationHeaderSection } from "./_components/quotation-header-section";
import { QuotationServiceLinesSection } from "./_components/quotation-service-lines-section";
import { QuotationFinancialSummary } from "./_components/quotation-financial-summary";
import { QuotationApprovalSection } from "./_components/quotation-approval-section";
import { QuotationApprovalDialog } from "./_components/quotation-approval-dialog";
import { QuotationMobileActionBar } from "./_components/quotation-mobile-action-bar";
import {
  BLANK_HEADER,
  type FieldErrors,
  type MasterData,
  type QuotationHeaderState,
} from "./_components/types";

function Workspace() {
  const router = useRouter();
  const params = useSearchParams();
  const routeKey = params.toString();

  // Dữ liệu Master & Chi tiết báo giá
  const [master, setMaster] = useState<MasterData | null>(null);
  const [detail, setDetail] = useState<QuotationDetailResponse | null>(null);
  useDocumentTitle(detail ? `Báo giá ${detail.quote.quotationNo} (v${detail.quote.version})` : "Lập báo giá");

  // Form State
  const [header, setHeader] = useState<QuotationHeaderState>(BLANK_HEADER);
  const [items, setItems] = useState<ServiceItemState[]>([emptyServiceItem("first")]);
  const [baseline, setBaseline] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Loading & Action State
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Dòng dịch vụ đang chọn
  const [active, setActive] = useState(0);

  // Review & Navigation Dialog States
  const [review, setReview] = useState<"APPROVE" | "REJECT" | "RETURN" | null>(null);
  const [comment, setComment] = useState("");
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const discarding = useRef(false);
  const opener = useRef<HTMLElement | null>(null);

  // Phân quyền & Khóa bảo mật
  const status = detail?.quote.status ?? "DRAFT";
  const actor = master && "actor" in master ? master.actor : undefined;
  const { can: canDo, isManager: manager } = usePermission(actor);
  const canEdit = canDo("QUOTATION_EDIT");
  const locked = !canEdit || status !== "DRAFT" || !!detail?.quote.immutableLocked || busy || loading || !!loadError;
  const dirty = !!baseline && commercialFingerprint(header, items) !== baseline;

  // Tính toán tài chính
  const totals = calculateQuotationFinancials(items);
  const missing = items.map((i, index) => ({ index, warning: rateWarning(i) })).filter((i) => i.warning);
  const item = items[active];
  const authority = evaluateApprovalAuthority(
    detail?.quote.estimatedMarginPercent ?? totals.estimatedMarginPercent,
    actor?.role ?? ""
  );
  const ownQuote = !!actor && !!detail && isQuotationAuthor(detail.quote.createdByUserId, detail.quote.createdBy, actor);

  // Khôi phục dữ liệu từ server
  const applyDetail = useCallback((d: QuotationDetailResponse) => {
    const h: QuotationHeaderState = {
      customerId: d.quote.customerId,
      regionId: d.quote.regionId,
      commodityId: d.quote.commodityId ?? "",
      paymentTermsDays: d.quote.paymentTermsDays,
    };
    const lines = restoreQuotationItems(d);
    setDetail(d);
    setHeader(h);
    setItems(lines);
    setActive(0);
    setBaseline(commercialFingerprint(h, lines));
    setFieldErrors({});
  }, []);

  // Khởi tạo và nạp dữ liệu ban đầu
  useEffect(() => {
    let current = true;
    async function init() {
      setLoading(true);
      setLoadError("");
      setError("");
      setMessage("");
      setFieldErrors({});
      try {
        const m = await getQuotationMasterDataAction();
        if (!current) return;
        if (!m.success) throw new Error(m.error ?? "Không tải được danh mục.");
        setMaster(m);
        const query = new URLSearchParams(routeKey);
        const id = query.get("id");
        if (id) {
          const r = await getQuotationDetailAction(id);
          if (!current) return;
          if (!r.success || !r.data) throw new Error(r.error ?? "Không tải được báo giá.");
          applyDetail(r.data);
        } else {
          const pick = (key: string, options: { id: string }[]) =>
            options.some((o) => o.id === query.get(key)) ? query.get(key)! : "";
          const h: QuotationHeaderState = {
            ...BLANK_HEADER,
            customerId: pick("customerId", m.customers),
            commodityId: pick("commodityId", m.commodities),
          };
          const line = {
            ...emptyServiceItem("first"),
            originLocationId: pick("origin", m.locations),
            destinationLocationId: pick("dest", m.locations),
            equipmentType: pick("eq", m.equipmentTypes),
          };
          setDetail(null);
          setHeader(h);
          setItems([line]);
          setActive(0);
          setBaseline(commercialFingerprint(h, [line]));
          setFieldErrors({});
        }
      } catch (e) {
        if (current) setLoadError(e instanceof Error ? e.message : "Không tải được dữ liệu.");
      } finally {
        if (current) setLoading(false);
      }
    }
    const timer = setTimeout(() => void init(), 0);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [routeKey, retry, applyDetail]);

  // Ngăn chặn rời trang khi có thay đổi chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      if (!discarding.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (
        link &&
        event.button === 0 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !link.hasAttribute("download") &&
        link.target !== "_blank" &&
        link.href !== window.location.href
      ) {
        event.preventDefault();
        event.stopPropagation();
        opener.current = link;
        setLeaveTarget(link.href);
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);

  // Bọc thực thi hành động với cờ busy và xử lý lỗi
  async function perform(task: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Thao tác thất bại. Vui lòng thử lại.";
      setError(msg);
      toast.error(msg);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  // Tải lại dữ liệu báo giá sau khi lưu hoặc duyệt
  async function refresh(id: string) {
    const r = await getQuotationDetailAction(id);
    if (!r.success || !r.data) {
      setLoadError("Đã xử lý nhưng chưa tải lại được báo giá. Hãy tải lại trước khi thao tác tiếp.");
      throw new Error(r.error ?? "Không tải lại được báo giá.");
    }
    applyDetail(r.data);
  }

  // Cập nhật giá trị một dòng dịch vụ
  function updateItem(patch: Partial<ServiceItemState>, route = false) {
    setFieldErrors((prev) => {
      if (!prev.items?.[active]) return prev;
      const updatedItemErrors = { ...prev.items[active] };
      for (const k of Object.keys(patch)) {
        delete updatedItemErrors[k as keyof typeof updatedItemErrors];
      }
      return {
        ...prev,
        items: {
          ...prev.items,
          [active]: updatedItemErrors,
        },
      };
    });

    setItems((prev) =>
      prev.map((x, i) =>
        i === active
          ? {
              ...x,
              ...patch,
              ...(route
                ? {
                    selectedBuyRateId: undefined,
                    selectedCandidate: undefined,
                    lookupResult: undefined,
                    unitBuyPrice: 0,
                    worstCaseBuyPrice: 0,
                  }
                : {}),
            }
          : x
      )
    );
  }

  // Tra cứu giá mua NCC cho tuyến đường
  function lookup() {
    if (!item) return;
    const errors: {
      originLocationId?: string;
      destinationLocationId?: string;
      equipmentType?: string;
    } = {};
    if (!item.originLocationId) errors.originLocationId = "Vui lòng chọn điểm đi.";
    if (!item.destinationLocationId) errors.destinationLocationId = "Vui lòng chọn điểm đến.";
    if (
      item.originLocationId &&
      item.destinationLocationId &&
      item.originLocationId === item.destinationLocationId
    ) {
      errors.destinationLocationId = "Điểm đi và điểm đến phải khác nhau.";
    }
    if (!item.equipmentType) errors.equipmentType = "Vui lòng chọn loại thiết bị.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [active]: { ...prev.items?.[active], ...errors },
        },
      }));
      const firstMsg = Object.values(errors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    void perform(async () => {
      const result = await lookupRoadRatesAction({
        pickupLocationId: item.originLocationId,
        deliveryLocationId: item.destinationLocationId,
        equipmentType: item.equipmentType,
        pricingDate: getBusinessDate(),
      });
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? {
                ...x,
                lookupResult: result,
                selectedBuyRateId: undefined,
                selectedCandidate: undefined,
                unitBuyPrice: 0,
                worstCaseBuyPrice: result.worstCaseBuy ?? 0,
              }
            : x
        )
      );
      if (["ERROR", "CONFLICT_RATE", "MISSING_RATE"].includes(result.status)) {
        throw new Error(result.message ?? "Không có giá mua phù hợp.");
      }
      setMessage("Chọn một nhà cung cấp trong bảng so sánh bên dưới.");
    });
  }

  // Lưu bản nháp hoặc Lưu & Gửi duyệt
  function save(submit: boolean) {
    void perform(async () => {
      const payload = {
        customerId: header.customerId,
        regionId: header.regionId,
        commodityId: header.commodityId || undefined,
        paymentTermsDays: header.paymentTermsDays,
        quotationId: detail?.quote.quotationId,
        expectedUpdatedAt: detail?.quote.revision,
        items: items.map((x) => ({
          ...x,
          servicePackage: x.servicePackage as ServicePackage,
          totalBuyAmount: 0,
          totalSellPrice: 0,
          itemGp: 0,
          itemMarginPercent: 0,
        })),
      };

      const parsed = createQuotationSchema.safeParse(payload);
      if (!parsed.success) {
        const newErrors: FieldErrors = { items: {} };
        let firstMsg = "";
        for (const issue of parsed.error.issues) {
          if (!firstMsg) firstMsg = issue.message;
          const p = issue.path;
          if (p[0] === "customerId") {
            newErrors.customerId = "Vui lòng chọn khách hàng.";
          } else if (p[0] === "regionId") {
            newErrors.regionId = "Vui lòng chọn vùng phụ trách.";
          } else if (p[0] === "paymentTermsDays") {
            newErrors.paymentTermsDays = issue.message || "Hạn thanh toán không hợp lệ.";
          } else if (p[0] === "items" && typeof p[1] === "number") {
            const idx = p[1];
            const field = String(p[2] || "");
            if (!newErrors.items) newErrors.items = {};
            if (!newErrors.items[idx]) newErrors.items[idx] = {};
            if (field === "destinationLocationId" && issue.message.includes("khác nhau")) {
              newErrors.items[idx].destinationLocationId = "Điểm đến phải khác điểm đi.";
            } else if (field === "originLocationId") {
              newErrors.items[idx].originLocationId = "Vui lòng chọn điểm đi.";
            } else if (field === "destinationLocationId") {
              newErrors.items[idx].destinationLocationId = "Vui lòng chọn điểm đến.";
            } else if (field === "equipmentType") {
              newErrors.items[idx].equipmentType = "Vui lòng chọn loại thiết bị.";
            } else if (field === "plannedQuantity") {
              newErrors.items[idx].plannedQuantity = issue.message || "Số lượng tối thiểu là 1.";
            } else if (field === "unitSellPrice") {
              newErrors.items[idx].unitSellPrice = issue.message || "Đơn giá bán không hợp lệ.";
            }
          }
        }
        setFieldErrors(newErrors);
        const errorIndices = Object.keys(newErrors.items || {}).map(Number);
        if (errorIndices.length > 0 && !errorIndices.includes(active)) {
          setActive(errorIndices[0]);
        }
        throw new Error(firstMsg || "Vui lòng hoàn thiện các trường bắt buộc.");
      }

      setFieldErrors({});

      if (submit && missing.length) {
        throw new Error("Chọn giá mua còn hiệu lực cho tất cả các dòng trước khi gửi duyệt.");
      }

      const result = await saveDraftQuotationAction(
        {
          ...header,
          quotationId: detail?.quote.quotationId,
          expectedUpdatedAt: detail?.quote.revision,
          items: items.map((x) => ({
            ...x,
            servicePackage: x.servicePackage as ServicePackage,
            totalBuyAmount: 0,
            totalSellPrice: 0,
            itemGp: 0,
            itemMarginPercent: 0,
          })),
        },
        submit
      );

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Không lưu được báo giá.");
      }

      window.history.replaceState(window.history.state, "", `/quotations/new?id=${result.data.quotationId}`);
      await refresh(result.data.quotationId);
      const saveMsg = submit ? "Đã lưu và gửi duyệt báo giá." : "Đã lưu bản nháp báo giá.";
      setMessage(saveMsg);
      toast.success(saveMsg);
    });
  }

  // Thực hiện phê duyệt / từ chối / trả về nháp
  function decide() {
    if (!detail || !review) return;
    void perform(async () => {
      if (
        (review !== "APPROVE" && !comment.trim()) ||
        (review === "APPROVE" && detail.quote.estimatedMarginPercent < 15 && comment.trim().length < 5)
      ) {
        throw new Error("Vui lòng nhập lý do (duyệt biên thấp cần ít nhất 5 ký tự).");
      }
      const fn =
        review === "APPROVE"
          ? approveQuotationAction
          : review === "REJECT"
          ? rejectQuotationAction
          : returnQuotationToDraftAction;
      const result = await fn(detail.quote.quotationId, comment.trim());
      if (!result.success) throw new Error(result.error ?? "Không xử lý được yêu cầu.");
      setReview(null);
      await refresh(detail.quote.quotationId);
      const statusMsg =
        review === "APPROVE"
          ? "Đã phê duyệt báo giá thành công."
          : review === "REJECT"
          ? "Đã từ chối báo giá."
          : "Đã trả báo giá về bản nháp.";
      setMessage(statusMsg);
      toast.success(statusMsg);
    });
  }

  function startReview(action: "APPROVE" | "REJECT" | "RETURN") {
    opener.current = document.activeElement as HTMLElement;
    setComment("");
    setError("");
    setReview(action);
  }

  // Tạo phiên bản mới khi báo giá đã approved
  const handleCreateVersion = () => {
    if (!detail) return;
    void perform(async () => {
      const result = await createQuotationVersionAction(
        detail.quote.quotationId,
        detail.quote.revision
      );
      if (!result.success) throw new Error(result.error);
      router.push(`/quotations/new?id=${result.id}`);
    });
  };

  // Xác nhận thoát trang khi có dữ liệu bẩn
  const handleConfirmLeave = () => {
    if (!leaveTarget) return;
    const target = new URL(leaveTarget);
    discarding.current = true;
    setLeaveTarget(null);
    if (target.origin === window.location.origin) {
      router.push(target.pathname + target.search + target.hash);
    } else {
      window.location.href = target.href;
    }
  };

  return (
    <div className="space-y-5 text-foreground font-sans pb-20 lg:pb-6">
      {/* 1. Header Bar: Tiêu đề, Trạng thái & Các nút tác vụ */}
      <QuotationHeaderBar
        detail={detail}
        status={status}
        dirty={dirty}
        canEdit={canEdit}
        locked={locked}
        busy={busy}
        onSave={save}
        onCreateVersion={handleCreateVersion}
      />

      {/* Thông báo trạng thái & Thông báo lỗi */}
      {loading && (
        <div className="p-4 rounded-xl bg-surface border border-border text-xs text-muted-foreground animate-pulse">
          Đang nạp hồ sơ báo giá và danh mục hệ thống...
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-4 text-xs text-red-800 dark:text-red-300 flex items-center justify-between gap-3"
        >
          <span>{loadError}</span>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-red-300 bg-surface font-semibold hover:bg-surface-hover transition-colors"
            onClick={() => setRetry((x) => x + 1)}
          >
            Tải lại
          </button>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 p-3.5 text-xs font-medium"
        >
          {message}
        </div>
      )}

      {error && !review && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-950/40 dark:text-red-300 p-3.5 text-xs font-medium whitespace-pre-wrap"
        >
          {error}
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* 2. Thông tin chung hồ sơ */}
          <QuotationHeaderSection
            header={header}
            onHeaderChange={setHeader}
            master={master}
            locked={locked}
            fieldErrors={fieldErrors}
            onClearFieldError={(field) =>
              setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
            }
          />

          {/* 3. Bố cục Master-Detail: Tuyến dịch vụ (Trái) & Tổng hợp tài chính P&L (Phải) */}
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* Cột trái: Tuyến vận tải, Dòng dịch vụ & Tra cứu giá NCC */}
            <QuotationServiceLinesSection
              items={items}
              active={active}
              setActive={setActive}
              onAddItem={() => {
                setItems((prev) => [...prev, emptyServiceItem(crypto.randomUUID())]);
                setActive(items.length);
              }}
              onRemoveItem={(i) => {
                setItems((prev) => prev.filter((_, n) => n !== i));
                setActive(0);
              }}
              onUpdateItem={updateItem}
              onLookup={lookup}
              master={master}
              locked={locked}
              busy={busy}
              status={status}
              fieldErrors={fieldErrors}
            />

            {/* Cột phải: Panel Tổng hợp tài chính P&L cố định Viewport */}
            <QuotationFinancialSummary
              totals={totals}
              missingCount={missing.length}
              status={status}
              authority={authority}
            />
          </div>

          {/* 4. Khối thẩm định & Lịch sử phê duyệt */}
          {detail && (
            <QuotationApprovalSection
              detail={detail}
              status={status}
              ownQuote={ownQuote}
              authority={authority}
              manager={manager}
              busy={busy}
              onStartReview={startReview}
            />
          )}
        </>
      )}

      {/* 5. Hộp thoại Cảnh báo dữ liệu chưa lưu */}
      <ConfirmDialog
        open={!!leaveTarget}
        onOpenChange={(open) => !open && setLeaveTarget(null)}
        title="Có thay đổi chưa được lưu"
        description="Dữ liệu báo giá vừa soạn thảo chưa được lưu vào hệ thống. Nếu rời khỏi màn hình lúc này, các thay đổi chưa lưu sẽ bị hủy."
        cancelLabel="Ở lại tiếp tục soạn"
        confirmLabel="Bỏ thay đổi &amp; Rời trang"
        variant="destructive"
        onConfirm={handleConfirmLeave}
      />

      {/* 6. Hộp thoại Thẩm định / Phê duyệt / Từ chối */}
      <QuotationApprovalDialog
        review={review}
        onClose={() => setReview(null)}
        comment={comment}
        onCommentChange={setComment}
        error={error}
        busy={busy}
        onConfirm={decide}
      />

      {/* 7. Thanh tác vụ cố định dưới đáy Mobile */}
      <QuotationMobileActionBar
        totals={totals}
        status={status}
        canEdit={canEdit}
        locked={locked}
        busy={busy}
        onSave={save}
      />
    </div>
  );
}

export default function QuotationWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-foreground">
          Đang khởi tạo không gian soạn thảo báo giá...
        </div>
      }
    >
      <Workspace />
    </Suspense>
  );
}
