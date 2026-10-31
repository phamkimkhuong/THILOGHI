"use client";

import { PageHeader, RefreshButton, TableFeedback, Pagination, usePagination, useListFeedback } from "@/components/ui/list-page";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Search,
  Building2,
  Truck,
  RefreshCw,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  X,
  CreditCard,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Ban,
  History,
  SlidersHorizontal,
  CheckCircle2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCustomersAndVendorsAction,
  getPartnersDirectoryAction,
  activateCustomerRoleAction,
  suspendCustomerRoleAction,
  requestCustomerRoleActivationAction,
  updateCustomerRoleTermsAction,
  getPartnerRoleAuditHistoryAction,
} from "@/features/master-data/actions";
import { PartnerDirectoryItem, PartnerRoleAuditItem } from "@/server/modules/master-data/partner-lifecycle.service";

interface CustomerRecord {
  customerId: string;
  customerName: string;
  shortName?: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  paymentTermsDays?: number;
  creditLimit?: number | null;
  status: string; // ACTIVE, PENDING, SUSPENDED
  createdAt: string;
}

interface VendorRecord {
  vendorId: string;
  vendorName: string;
  vendorType: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  status: string;
  createdAt: string;
}

export default function MasterCustomersPage() {
  const [activeTab, setActiveTab] = useState<"CUSTOMERS" | "VENDORS" | "PARTNERS">("CUSTOMERS");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [partners, setPartners] = useState<PartnerDirectoryItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleStatusFilter, setRoleStatusFilter] = useState("ALL");
  const [paymentTermsFilter, setPaymentTermsFilter] = useState("ALL");

  // Drawer state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorRecord | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerDirectoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"INFO" | "LIFECYCLE" | "AUDIT">("INFO");

  // Lifecycle form states
  const [termsDaysInput, setTermsDaysInput] = useState<number>(30);
  const [creditLimitInput, setCreditLimitInput] = useState<string>("");
  const [suspendReasonInput, setSuspendReasonInput] = useState("");
  const [activationCommentInput, setActivationCommentInput] = useState("");
  const [auditLogs, setAuditLogs] = useState<PartnerRoleAuditItem[]>([]);
  const { loading: isLoadingAudit, error: auditError, runLoad: runAudit } = useListFeedback();


  const { loading, error: loadError, runLoad } = useListFeedback();

  const loadData = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const [resCv, resPartners] = await Promise.all([getCustomersAndVendorsAction(), getPartnersDirectoryAction()]);
      if (!resCv.success || !resPartners.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      setCustomers((resCv.customers || []) as CustomerRecord[]);
      setVendors((resCv.vendors || []) as VendorRecord[]);
      setPartners((resPartners.data || []) as PartnerDirectoryItem[]);
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load audit trail when opening audit tab
  const loadAuditHistory = useCallback(async (partnerId: string) => {
    await runAudit(async (isCurrent) => {
      setAuditLogs([]);
      const res = await getPartnerRoleAuditHistoryAction(partnerId);
      if (!res.success) throw new Error("Load failed");
      if (isCurrent()) setAuditLogs(res.data || []);
    });
  }, [runAudit]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          (c.shortName && c.shortName.toLowerCase().includes(q)) ||
          (c.taxCode && c.taxCode.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          c.customerId.toLowerCase().includes(q)
      );
    }
    if (roleStatusFilter !== "ALL") {
      list = list.filter((c) => c.status === roleStatusFilter);
    }
    if (paymentTermsFilter !== "ALL") {
      const days = Number(paymentTermsFilter);
      list = list.filter((c) => (c.paymentTermsDays ?? 30) === days);
    }
    return list;
  }, [customers, searchTerm, roleStatusFilter, paymentTermsFilter]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    let list = [...vendors];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(q) ||
          v.vendorType.toLowerCase().includes(q) ||
          (v.taxCode && v.taxCode.toLowerCase().includes(q)) ||
          v.vendorId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vendors, searchTerm]);

  // Filtered Partners
  const filteredPartners = useMemo(() => {
    let list = [...partners];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.partnerName.toLowerCase().includes(q) ||
          (p.shortName && p.shortName.toLowerCase().includes(q)) ||
          (p.taxCode && p.taxCode.toLowerCase().includes(q)) ||
          p.partnerId.toLowerCase().includes(q)
      );
    }
    if (roleStatusFilter !== "ALL") {
      list = list.filter((p) => p.customerRoleStatus === roleStatusFilter);
    }
    return list;
  }, [partners, searchTerm, roleStatusFilter]);

  const activeLength = activeTab === "CUSTOMERS" ? filteredCustomers.length : activeTab === "VENDORS" ? filteredVendors.length : filteredPartners.length;
  const loadedLength = activeTab === "CUSTOMERS" ? customers.length : activeTab === "VENDORS" ? vendors.length : partners.length;
  const pagination = usePagination(activeLength, JSON.stringify([activeTab, searchTerm, roleStatusFilter, paymentTermsFilter]));

  // Open Customer Drawer
  const handleOpenCustomerDrawer = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setSelectedVendor(null);
    setSelectedPartner(null);
    setTermsDaysInput(customer.paymentTermsDays ?? 30);
    setCreditLimitInput(customer.creditLimit == null ? "" : String(customer.creditLimit));
    setSuspendReasonInput("");
    setActivationCommentInput("");
    setDrawerTab("INFO");
    setIsDrawerOpen(true);
    loadAuditHistory(customer.customerId);
  };

  // Open Vendor Drawer
  const handleOpenVendorDrawer = (vendor: VendorRecord) => {
    loadAuditHistory(vendor.vendorId);
    setSelectedVendor(vendor);
    setSelectedCustomer(null);
    setSelectedPartner(null);
    setDrawerTab("INFO");
    setIsDrawerOpen(true);
  };

  // Open Partner Drawer
  const handleOpenPartnerDrawer = (partner: PartnerDirectoryItem) => {
    setSelectedPartner(partner);
    setSelectedCustomer(null);
    setSelectedVendor(null);
    setTermsDaysInput(partner.paymentTermsDays ?? 30);
    setCreditLimitInput(partner.creditLimitVnd == null ? "" : String(partner.creditLimitVnd));
    setSuspendReasonInput("");
    setActivationCommentInput("");
    setDrawerTab("INFO");
    setIsDrawerOpen(true);
    loadAuditHistory(partner.partnerId);
  };

  // Execute Role Actions
  const handleActivateRole = async (partnerId: string) => {
    const trimmed = creditLimitInput.trim();
    const parsedLimit = trimmed === "" ? null : Math.max(0, Number(trimmed));
    const res = await activateCustomerRoleAction({
      partnerId,
      paymentTermsDays: Number(termsDaysInput),
      creditLimitVnd: parsedLimit,
      comment: activationCommentInput.trim() || undefined,
    });
    if (res.success) {
      toast.success(res.message || "Đã kích hoạt vai trò Khách hàng thành công!");
      loadData();
      loadAuditHistory(partnerId);
      // update local status
      if (selectedCustomer) setSelectedCustomer({ ...selectedCustomer, status: "ACTIVE", creditLimit: parsedLimit });
      if (selectedPartner) setSelectedPartner({ ...selectedPartner, customerRoleStatus: "ACTIVE", isCustomer: true, creditLimitVnd: parsedLimit });
    } else {
      toast.error(res.error || "Lỗi khi kích hoạt vai trò Khách hàng");
    }
  };

  const handleSuspendRole = async (partnerId: string) => {
    if (!suspendReasonInput.trim() || suspendReasonInput.trim().length < 3) {
      toast.error("Vui lòng nhập lý do tạm ngừng tối thiểu 3 ký tự.");
      return;
    }
    const res = await suspendCustomerRoleAction({
      partnerId,
      reason: suspendReasonInput.trim(),
    });
    if (res.success) {
      toast.success(res.message || "Đã tạm ngừng vai trò Khách hàng.");
      loadData();
      loadAuditHistory(partnerId);
      if (selectedCustomer) setSelectedCustomer({ ...selectedCustomer, status: "SUSPENDED" });
      if (selectedPartner) setSelectedPartner({ ...selectedPartner, customerRoleStatus: "SUSPENDED" });
    } else {
      toast.error(res.error || "Lỗi khi tạm ngừng vai trò");
    }
  };

  const handleRequestActivation = async (partnerId: string) => {
    const res = await requestCustomerRoleActivationAction(partnerId);
    if (res.success) {
      toast.success(res.message || "Đã gửi đề nghị kích hoạt vai trò!");
      loadData();
      loadAuditHistory(partnerId);
      if (selectedPartner) setSelectedPartner({ ...selectedPartner, customerRoleStatus: "PENDING", isCustomer: true });
    } else {
      toast.error(res.error || "Lỗi khi gửi đề nghị");
    }
  };

  const handleUpdateTerms = async (partnerId: string) => {
    const trimmed = creditLimitInput.trim();
    const parsedLimit = trimmed === "" ? null : Math.max(0, Number(trimmed));
    const res = await updateCustomerRoleTermsAction({
      partnerId,
      paymentTermsDays: Number(termsDaysInput),
      creditLimitVnd: parsedLimit,
    });
    if (res.success) {
      toast.success(res.message || "Đã cập nhật hạn mức nợ và tín dụng!");
      loadData();
      loadAuditHistory(partnerId);
      if (selectedCustomer) setSelectedCustomer({ ...selectedCustomer, creditLimit: parsedLimit, paymentTermsDays: Number(termsDaysInput) });
      if (selectedPartner) setSelectedPartner({ ...selectedPartner, creditLimitVnd: parsedLimit, paymentTermsDays: Number(termsDaysInput) });
    } else {
      toast.error(res.error || "Lỗi khi cập nhật");
    }
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const getStatusBadge = (status: string) => <StatusBadge status={status} />;

  const currentRoleStatus = selectedCustomer?.status || selectedVendor?.status || selectedPartner?.customerRoleStatus || "NONE";
  const currentPartnerId = selectedCustomer?.customerId || selectedVendor?.vendorId || selectedPartner?.partnerId || "";
  const currentName = selectedCustomer?.customerName || selectedVendor?.vendorName || selectedPartner?.partnerName || "";

  return (
    <div className="space-y-4 font-sans text-slate-200">
      <PageHeader title="Đối tác" actions={<><RefreshButton onClick={loadData} loading={loading} /><Link href="/quotations/new" className="erp-button bg-blue-600 text-white hover:bg-blue-500"><PlusCircle className="h-4 w-4" />Lập báo giá</Link></>} />

      {/* Tabs and Instant Search */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => {
              setActiveTab("CUSTOMERS");
              setSearchTerm("");
              setRoleStatusFilter("ALL");
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "CUSTOMERS"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Khách hàng ( {customers.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("VENDORS");
              setSearchTerm("");
              setRoleStatusFilter("ALL");
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "VENDORS"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Nhà cung cấp ({vendors.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("PARTNERS");
              setSearchTerm("");
              setRoleStatusFilter("ALL");
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "PARTNERS"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Tất cả đối tác ({partners.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Role Status Filter (for customers and partners) */}
          {activeTab !== "VENDORS" && (
             <select aria-label="Trạng thái đối tác" value={roleStatusFilter}
              onChange={(e) => setRoleStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ACTIVE">Vai trò ACTIVE</option>
              <option value="PENDING">Vai trò PENDING</option>
              <option value="SUSPENDED">Vai trò SUSPENDED</option>
            </select>
          )}

          {/* Payment Terms Filter */}
          {activeTab === "CUSTOMERS" && (
             <select aria-label="Hạn thanh toán" value={paymentTermsFilter}
              onChange={(e) => setPaymentTermsFilter(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả hạn nợ</option>
              <option value="15">15 ngày</option>
              <option value="30">30 ngày</option>
              <option value="45">45 ngày</option>
              <option value="60">60 ngày</option>
            </select>
          )}

          {/* Instant Search Box */}
          <div className="relative w-full md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm đối tác, MST..." aria-label="Tìm kiếm đối tác, MST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
          {activeTab === "CUSTOMERS" && (
            <table className="erp-table w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Mã KH</th>
                  <th className="py-2.5 px-3">Tên Khách Hàng (SELL)</th>
                  <th className="py-2.5 px-3">Mã Số Thuế</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái Role</th>
                  <th className="py-2.5 px-3 text-center">Hạn Nợ</th>
                  <th className="py-2.5 px-3 text-right">Hạn Mức Tín Dụng</th>
                  <th className="py-2.5 px-3">Địa Chỉ</th>
                  <th className="py-2.5 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading || loadError ? <TableFeedback columns={8} loading={loading} error={loadError} onRetry={loadData} /> : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Không tìm thấy khách hàng phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.slice(pagination.start, pagination.end).map((c) => (
                    <tr
                      key={c.customerId}
                      onClick={() => handleOpenCustomerDrawer(c)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-xs whitespace-nowrap">
                        {c.customerId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-100 max-w-[220px] truncate" title={c.customerName}>
                        {c.customerName}
                        {c.shortName && (
                          <span className="block text-xs text-slate-400 font-normal">
                            {c.shortName}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {c.taxCode || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">
                          {c.paymentTermsDays ?? 30} ngày
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200 whitespace-nowrap">
                        {c.creditLimit == null ? (
                          <span className="text-slate-500 italic text-xs">Chưa cấu hình</span>
                        ) : Number(c.creditLimit) === 0 ? (
                          <span className="text-amber-400 font-medium">0 ₫ (Trả trước)</span>
                        ) : (
                          formatVND(Number(c.creditLimit))
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-xs max-w-[200px] truncate" title={c.address}>
                        {c.address || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {c.status === "ACTIVE" ? (
                          <Link
                            href={`/quotations/new?customerId=${c.customerId}`}
                            className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                          >
                            <PlusCircle className="w-3 h-3" /> Báo Giá
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleOpenCustomerDrawer(c)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3 h-3" /> Quản lý Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "VENDORS" && (
            <table className="erp-table w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Mã NCC</th>
                  <th className="py-2.5 px-3">Tên Nhà Xe / Đối Tác</th>
                  <th className="py-2.5 px-3">Phân loại Dịch Vụ</th>
                  <th className="py-2.5 px-3">Mã Số Thuế</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái Role</th>
                  <th className="py-2.5 px-3">Điện thoại</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading || loadError ? <TableFeedback columns={8} loading={loading} error={loadError} onRetry={loadData} /> : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Không tìm thấy nhà cung cấp phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.slice(pagination.start, pagination.end).map((v) => (
                    <tr
                      key={v.vendorId}
                      onClick={() => handleOpenVendorDrawer(v)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-xs whitespace-nowrap">
                        {v.vendorId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-100 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{v.vendorName}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-xs border border-blue-500/20">
                          {v.vendorType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {v.taxCode || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(v.status)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {v.phone || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {v.email || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/rates?vendorId=${v.vendorId}`}
                          className="px-2.5 py-1 rounded bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Tra Cứu Cước
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "PARTNERS" && (
            <table className="erp-table w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Mã Đối Tác</th>
                  <th className="py-2.5 px-3">Tên Pháp Nhân</th>
                  <th className="py-2.5 px-3">Phân Nhóm Gốc</th>
                  <th className="py-2.5 px-3">Mã Số Thuế</th>
                  <th className="py-2.5 px-3 text-center">Vai Trò Customer</th>
                  <th className="py-2.5 px-3 text-center">Vai Trò Vendor</th>
                  <th className="py-2.5 px-3 text-center">Hạn Nợ</th>
                  <th className="py-2.5 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading || loadError ? <TableFeedback columns={8} loading={loading} error={loadError} onRetry={loadData} /> : filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Không tìm thấy đối tác trong danh mục.
                    </td>
                  </tr>
                ) : (
                  filteredPartners.slice(pagination.start, pagination.end).map((p) => (
                    <tr
                      key={p.partnerId}
                      onClick={() => handleOpenPartnerDrawer(p)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-xs whitespace-nowrap">
                        {p.partnerId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-100 max-w-[240px] truncate" title={p.partnerName}>
                        {p.partnerName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-xs">
                          {p.sourcePartnerType || "Đối tác"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {p.taxCode || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(p.customerRoleStatus || "NONE")}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {p.isVendor ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            VENDOR ({p.vendorType || "BUY"})
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 whitespace-nowrap">
                        {p.customerRoleStatus === "ACTIVE" ? `${p.paymentTermsDays} ngày` : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {p.customerRoleStatus === "ACTIVE" ? (
                          <Link
                            href={`/quotations/new?customerId=${p.partnerId}`}
                            className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <PlusCircle className="w-3 h-3" /> Lập báo giá
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleOpenPartnerDrawer(p)}
                            className="px-2.5 py-1 rounded bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" /> Quản Lý Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Pagination pagination={pagination} loading={loading} error={!!loadError} loaded={loadedLength} limit={activeTab === "VENDORS" ? 200 : 300} />

      {/* Slide-out Drawer for Lifecycle Management & Details */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl p-5 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {currentName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-400">
                        ID: {currentPartnerId}
                      </span>
                      {getStatusBadge(currentRoleStatus)}
                    </div>
                  </div>
                </div>
                <button
                  aria-label="Đóng chi tiết" onClick={() => { setIsDrawerOpen(false); }}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Sub-tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <button
                  onClick={() => setDrawerTab("INFO")}
                  className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${
                    drawerTab === "INFO"
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Hồ Sơ Đối Tác
                </button>
                <button
                  onClick={() => setDrawerTab("LIFECYCLE")}
                  className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${
                    drawerTab === "LIFECYCLE"
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Vòng Đời Role (Kích Hoạt/Ngừng)
                </button>
                <button
                  onClick={() => setDrawerTab("AUDIT")}
                  className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${
                    drawerTab === "AUDIT"
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Lịch Sử Audit ({auditLogs.length})
                </button>
              </div>

              {/* Tab 1: INFO */}
              {drawerTab === "INFO" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div>
                      <span className="text-xs text-slate-500 block">Tên doanh nghiệp:</span>
                      <strong className="text-sm text-slate-100 block mt-0.5">
                        {currentName}
                      </strong>
                    </div>
                    {(selectedCustomer?.taxCode || selectedVendor?.taxCode || selectedPartner?.taxCode) && (
                      <div>
                        <span className="text-xs text-slate-500 block">Mã số thuế:</span>
                        <span className="text-slate-200 font-mono font-bold">
                          {selectedCustomer?.taxCode || selectedVendor?.taxCode || selectedPartner?.taxCode}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-start gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>{selectedCustomer?.address || selectedPartner?.address || "Chưa cập nhật địa chỉ"}</span>
                    </div>
                    {(selectedCustomer?.phone || selectedVendor?.phone || selectedPartner?.phone) && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-mono">
                          {selectedCustomer?.phone || selectedVendor?.phone || selectedPartner?.phone}
                        </span>
                      </div>
                    )}
                    {(selectedCustomer?.email || selectedVendor?.email || selectedPartner?.email) && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{selectedCustomer?.email || selectedVendor?.email || selectedPartner?.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Hạn nợ thương mại:
                      </span>
                      <strong className="text-white">
                        {termsDaysInput} ngày
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> Hạn mức tín dụng:
                      </span>
                      {creditLimitInput.trim() === "" ? (
                        <span className="text-slate-400 italic font-mono text-xs">
                          Chưa thiết lập (Không áp dụng)
                        </span>
                      ) : Number(creditLimitInput) === 0 ? (
                        <span className="text-amber-400 font-mono font-medium">
                          0 ₫ (Không cấp nợ / Trả trước)
                        </span>
                      ) : (
                        <strong className="text-emerald-400">
                          {formatVND(Number(creditLimitInput))}
                        </strong>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: LIFECYCLE MANAGEMENT */}
              {drawerTab === "LIFECYCLE" && (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 space-y-2">
                    <h4 className="font-bold text-blue-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Quy tắc Quản trị Vai trò (Role Enforcement)
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      Một Đối tác chỉ có thể được chọn làm người mua dịch vụ trong Báo giá khi Customer Role ở trạng thái <strong>ACTIVE</strong>. Nếu đối tác chưa được kích hoạt hoặc đang bị tạm ngừng, hệ thống sẽ chặn không cho phép lập Báo giá (Fail-Closed).
                    </p>
                  </div>

                  {/* Terms & Credit Limit Configuration */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                      Cấu Hình Điều Khoản & Hạn Mức Tín Dụng
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Hạn nợ thương mại (ngày):
                        </label>
                        <select
                          value={termsDaysInput}
                          onChange={(e) => setTermsDaysInput(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="0">0 ngày (Thanh toán ngay)</option>
                          <option value="7">7 ngày</option>
                          <option value="15">15 ngày</option>
                          <option value="30">30 ngày (Tiêu chuẩn)</option>
                          <option value="45">45 ngày</option>
                          <option value="60">60 ngày</option>
                          <option value="90">90 ngày</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Hạn mức tín dụng (VND):
                        </label>
                        <input
                          type="number"
                          step="10000000"
                          min="0"
                          placeholder="Để trống: chưa cấu hình | 0: không cấp nợ" aria-label="Để trống: chưa cấu hình | 0: không cấp nợ"
                          value={creditLimitInput}
                          onChange={(e) => setCreditLimitInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600"
                        />
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {creditLimitInput.trim() === ""
                            ? "Để trống: Chưa cấu hình hạn mức"
                            : Number(creditLimitInput) === 0
                            ? "0 ₫: Không cấp hạn mức nợ (bắt buộc trả trước)"
                            : `Hạn mức phê duyệt: ${formatVND(Number(creditLimitInput))}`}
                        </span>
                      </div>
                    </div>

                    {currentRoleStatus === "ACTIVE" && (
                      <button
                        onClick={() => handleUpdateTerms(currentPartnerId)}
                        className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                      >
                        <SlidersHorizontal className="w-3 h-3" /> Cập nhật Điều khoản & Hạn mức
                      </button>
                    )}
                  </div>

                  {/* Actions by current status */}
                  {currentRoleStatus !== "ACTIVE" ? (
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Kích Hoạt Vai Trò Khách Hàng (Customer Role: ACTIVE)
                      </h4>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Ghi chú phê duyệt kích hoạt (tùy chọn):
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Đã thẩm định hồ sơ pháp lý & năng lực thanh toán..." aria-label="VD: Đã thẩm định hồ sơ pháp lý & năng lực thanh toán..."
                          value={activationCommentInput}
                          onChange={(e) => setActivationCommentInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleActivateRole(currentPartnerId)}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <ShieldCheck className="w-4 h-4" /> Kích Hoạt Ngay (Active Role)
                        </button>
                        {currentRoleStatus === "NONE" && (
                          <button
                            onClick={() => handleRequestActivation(currentPartnerId)}
                            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
                          >
                            Đề nghị xét duyệt (Pending)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-rose-900/40 space-y-3">
                      <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5" />
                        Tạm Ngừng Vai Trò Khách Hàng (Suspend Role)
                      </h4>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Lý do tạm ngừng (bắt buộc để kiểm toán):
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Quá hạn công nợ 60 ngày, đang giải quyết tranh chấp hợp đồng..." aria-label="VD: Quá hạn công nợ 60 ngày, đang giải quyết tranh chấp hợp đồng..."
                          value={suspendReasonInput}
                          onChange={(e) => setSuspendReasonInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <button
                        onClick={() => handleSuspendRole(currentPartnerId)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all"
                      >
                        <Ban className="w-3.5 h-3.5" /> Xác Nhận Tạm Ngừng Vai Trò
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: AUDIT TRAIL */}
              {drawerTab === "AUDIT" && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-400" />
                      Lịch Sử Thay Đổi Trạng thái Vai Trò
                    </span>
                    <button
                      onClick={() => loadAuditHistory(currentPartnerId)}
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingAudit ? "animate-spin" : ""}`} />
                      Làm mới
                    </button>
                  </div>

                  {isLoadingAudit ? <p role="status" className="py-8 text-center text-slate-400">Đang tải lịch sử…</p> : auditError ? <div role="alert" className="space-y-3 py-8 text-center text-slate-300"><p>Không tải được lịch sử thay đổi.</p><button type="button" onClick={() => loadAuditHistory(currentPartnerId)} className="erp-button border border-slate-700">Thử lại</button></div> : auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
                      Chưa có lịch sử thay đổi cho đối tác này.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div
                          key={log.logId}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white flex items-center gap-1">
                              {log.action === "ACTIVATE" && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                                  KÍCH HOẠT (ACTIVATE)
                                </span>
                              )}
                              {log.action === "SUSPEND" && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400">
                                  TẠM NGỪNG (SUSPEND)
                                </span>
                              )}
                              {log.action === "REQUEST_ACTIVATION" && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                                  ĐỀ NGHỊ (REQUEST)
                                </span>
                              )}
                              {log.action === "UPDATE_TERMS" && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400">
                                  ĐỔI HẠN MỨC (UPDATE)
                                </span>
                              )}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {new Date(log.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <div className="text-slate-400 font-sans text-xs pt-1">
                            Người thực hiện: <strong>{log.actorName || log.actorId}</strong>
                          </div>
                          {log.details && (
                            <div className="text-slate-400 text-xs bg-slate-900/60 p-1.5 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.details)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                THILOGI ERP • Partner Lifecycle v1.0
              </span>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Đóng chi tiết" onClick={() => { setIsDrawerOpen(false); }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Đóng
                </button>
                {currentRoleStatus === "ACTIVE" && (
                  <Link
                    href={`/quotations/new?customerId=${currentPartnerId}`}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Lập báo giá
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
