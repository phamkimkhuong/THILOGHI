"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Container,
  User,
  Building2,
  Calendar,
  FileCheck,
  CreditCard,
  Phone,
} from "lucide-react";
import {
  TractorFleetItem,
  TrailerFleetItem,
  DriverFleetItem,
  FleetVendorOption,
  SaveTractorInput,
  SaveTrailerInput,
  SaveDriverInput,
} from "./types";
import {
  saveTractorAction,
  saveTrailerAction,
  saveDriverAction,
} from "@/features/master-data/actions";

export type FleetFormTarget =
  | { type: "TRACTOR"; data?: TractorFleetItem }
  | { type: "TRAILER"; data?: TrailerFleetItem }
  | { type: "DRIVER"; data?: DriverFleetItem }
  | null;

interface FleetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: FleetFormTarget;
  vendors: FleetVendorOption[];
  onSuccess: () => void;
}

const COMMON_TRAILER_TYPES = [
  "RMX 3T (Moóc xương 3 trục)",
  "RMS 3T (Moóc sàn 3 trục)",
  "MLCD 3T (Moóc lùn 3 trục)",
  "RMX 2T (Moóc xương 2 trục)",
  "MLCD 2T (Moóc lùn 2 trục)",
  "RMX 3T-45 (Moóc xương 45 feet)",
  "TMB 3T (Moóc bửng 3 trục)",
  "Moóc lạnh chuyên dụng",
];

const COMMON_TRANSIT_ROUTES = [
  "Nội địa",
  "Việt-Lào",
  "Việt-Cam-Lào",
  "Cam-Lào-Việt",
  "Lào-Việt",
  "Cam-Việt",
  "Việt-Cam",
];

function getInitialTractorForm(data?: TractorFleetItem): SaveTractorInput {
  if (data) {
    return {
      tractorNo: data.tractorNo,
      originalTractorNo: data.tractorNo,
      vendorId: data.vendorId || "VTDB",
      modelType: data.modelType || "",
      transitRoute: data.transitRoute || "Nội địa",
      transitLicenseDate: data.transitLicenseDate
        ? data.transitLicenseDate.split("T")[0]
        : "",
      productionYear: data.productionYear || null,
      chassisNo: data.chassisNo || "",
      engineNo: data.engineNo || "",
      selfWeightTons: data.selfWeightTons || null,
      loadCapacityTons: data.loadCapacityTons || null,
      color: data.color || "",
      inspectionExpirationDate: data.inspectionExpirationDate
        ? data.inspectionExpirationDate.split("T")[0]
        : "",
      notes: data.notes || "",
      status: data.status || "Đang hoạt động",
    };
  }
  return {
    tractorNo: "",
    vendorId: "VTDB",
    modelType: "FV400",
    transitRoute: "Nội địa",
    transitLicenseDate: "",
    productionYear: new Date().getFullYear(),
    chassisNo: "",
    engineNo: "",
    selfWeightTons: 9.3,
    loadCapacityTons: 38.5,
    color: "Trắng xanh",
    inspectionExpirationDate: "",
    notes: "",
    status: "Đang hoạt động",
  };
}

function getInitialTrailerForm(data?: TrailerFleetItem): SaveTrailerInput {
  if (data) {
    return {
      trailerNo: data.trailerNo,
      originalTrailerNo: data.trailerNo,
      vendorId: data.vendorId || "VTDB",
      modelType: data.modelType || "RMX 3T",
      transitRoute: data.transitRoute || "Nội địa",
      transitLicenseDate: data.transitLicenseDate
        ? data.transitLicenseDate.split("T")[0]
        : "",
      manufacturer: data.manufacturer || "THACO",
      productionYear: data.productionYear || null,
      chassisNo: data.chassisNo || "",
      curbWeightTons: data.curbWeightTons || null,
      payloadCapacityTons: data.payloadCapacityTons || null,
      paintColor: data.paintColor || "",
      inspectionExpirationDate: data.inspectionExpirationDate
        ? data.inspectionExpirationDate.split("T")[0]
        : "",
      notes: data.notes || "",
      status: data.status || "Đang hoạt động",
    };
  }
  return {
    trailerNo: "",
    vendorId: "VTDB",
    modelType: "RMX 3T",
    transitRoute: "Nội địa",
    transitLicenseDate: "",
    manufacturer: "THACO",
    productionYear: new Date().getFullYear(),
    chassisNo: "",
    curbWeightTons: 6.2,
    payloadCapacityTons: 30.2,
    paintColor: "Trắng xanh",
    inspectionExpirationDate: "",
    notes: "",
    status: "Đang hoạt động",
  };
}

function getInitialDriverForm(data?: DriverFleetItem): SaveDriverInput {
  if (data) {
    return {
      driverId: data.driverId,
      originalDriverId: data.driverId,
      vendorId: data.vendorId || "VTDB",
      fullName: data.fullName,
      gender: data.gender || "Nam",
      birthday: data.birthday ? data.birthday.split("T")[0] : "",
      licenseNo: data.licenseNo || "",
      citizenId: data.citizenId || "",
      citizenIssueDate: data.citizenIssueDate
        ? data.citizenIssueDate.split("T")[0]
        : "",
      passportNo: data.passportNo || "",
      passportIssueDate: data.passportIssueDate
        ? data.passportIssueDate.split("T")[0]
        : "",
      phone: data.phone || "",
      nationality: data.nationality || "Việt Nam",
      hometown: data.hometown || "",
      gpsCoordinates: data.gpsCoordinates || "",
      address: data.address || "",
      notes: data.notes || "",
      status: data.status || "Đang hoạt động",
      isActive: data.isActive ?? true,
    };
  }
  return {
    driverId: "",
    vendorId: "VTDB",
    fullName: "",
    gender: "Nam",
    birthday: "",
    licenseNo: "",
    citizenId: "",
    citizenIssueDate: "",
    passportNo: "",
    passportIssueDate: "",
    phone: "",
    nationality: "Việt Nam",
    hometown: "",
    gpsCoordinates: "",
    address: "",
    notes: "",
    status: "Đang hoạt động",
    isActive: true,
  };
}

export function FleetFormDialog({
  open,
  onOpenChange,
  target,
  vendors,
  onSuccess,
}: FleetFormDialogProps) {
  if (!open || !target) return null;

  const instanceKey = `${target.type}-${
    target.data
      ? "tractorNo" in target.data
        ? target.data.tractorNo
        : "trailerNo" in target.data
        ? target.data.trailerNo
        : target.data.driverId
      : "new"
  }`;

  return (
    <FleetFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      target={target}
      vendors={vendors}
      onSuccess={onSuccess}
    />
  );
}

function FleetFormDialogContent({
  open,
  onOpenChange,
  target,
  vendors,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: NonNullable<FleetFormTarget>;
  vendors: FleetVendorOption[];
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  // Form state cho Tractor
  const [tractorForm, setTractorForm] = useState<SaveTractorInput>(() =>
    getInitialTractorForm(target.type === "TRACTOR" ? target.data : undefined)
  );

  // Form state cho Trailer
  const [trailerForm, setTrailerForm] = useState<SaveTrailerInput>(() =>
    getInitialTrailerForm(target.type === "TRAILER" ? target.data : undefined)
  );

  // Form state cho Driver
  const [driverForm, setDriverForm] = useState<SaveDriverInput>(() =>
    getInitialDriverForm(target.type === "DRIVER" ? target.data : undefined)
  );

  // Tiêu đề & phụ đề hộp thoại
  const isEdit = Boolean(target.data);
  let title = "";
  let subtitle = "";

  if (target.type === "TRACTOR") {
    title = isEdit
      ? `Chỉnh sửa xe đầu kéo ${target.data?.tractorNo}`
      : "Thêm mới xe đầu kéo";
    subtitle = "Hồ sơ kỹ thuật, đơn vị sở hữu và thông tin đăng kiểm đầu kéo";
  } else if (target.type === "TRAILER") {
    title = isEdit
      ? `Chỉnh sửa rơ-moóc ${target.data?.trailerNo}`
      : "Thêm mới rơ-moóc";
    subtitle = "Chủng loại moóc, tải trọng cho phép chở và thời hạn kiểm định";
  } else if (target.type === "DRIVER") {
    title = isEdit
      ? `Chỉnh sửa hồ sơ tài xế ${target.data?.fullName}`
      : "Thêm mới tài xế / Lái xe";
    subtitle = "Thông tin cá nhân, giấy phép lái xe và hộ chiếu liên vận quốc tế";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (target.type === "TRACTOR") {
        const res = await saveTractorAction(tractorForm);
        if (!res.success) throw new Error(res.error);
        toast.success(res.message);
      } else if (target.type === "TRAILER") {
        const res = await saveTrailerAction(trailerForm);
        if (!res.success) throw new Error(res.error);
        toast.success(res.message);
      } else if (target.type === "DRIVER") {
        const res = await saveDriverAction(driverForm);
        if (!res.success) throw new Error(res.error);
        toast.success(res.message);
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={subtitle}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {/* ======================================================== */}
        {/* 1. FORM ĐẦU KÉO (TRACTOR)                               */}
        {/* ======================================================== */}
        {target.type === "TRACTOR" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Biển số xe */}
              <div>
                <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Biển số xe đầu kéo</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 92C-14752"
                  value={tractorForm.tractorNo}
                  onChange={(e) =>
                    setTractorForm({
                      ...tractorForm,
                      tractorNo: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Đơn vị sở hữu / Nhà xe */}
              <div>
                <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đơn vị sở hữu / Nhà xe</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={tractorForm.vendorId}
                  onChange={(e) =>
                    setTractorForm({ ...tractorForm, vendorId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    -- Chọn Đơn vị / Nhà xe --
                  </option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.code ? `(${v.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Dòng xe / Model */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Dòng xe / Model
                </label>
                <input
                  type="text"
                  placeholder="VD: FV400, Auman..."
                  value={tractorForm.modelType || ""}
                  onChange={(e) =>
                    setTractorForm({ ...tractorForm, modelType: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tuyến liên vận */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Tuyến liên vận
                </label>
                <select
                  value={tractorForm.transitRoute || "Nội địa"}
                  onChange={(e) =>
                    setTractorForm({ ...tractorForm, transitRoute: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMON_TRANSIT_ROUTES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Năm sản xuất */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Năm sản xuất
                </label>
                <input
                  type="number"
                  min="1990"
                  max="2030"
                  value={tractorForm.productionYear || ""}
                  onChange={(e) =>
                    setTractorForm({
                      ...tractorForm,
                      productionYear: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Tải trọng kéo theo */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Khối lượng kéo theo (Tấn)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="VD: 38.77"
                  value={tractorForm.loadCapacityTons ?? ""}
                  onChange={(e) =>
                    setTractorForm({
                      ...tractorForm,
                      loadCapacityTons: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tự trọng xe */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Tự trọng xe (Tấn)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="VD: 9.30"
                  value={tractorForm.selfWeightTons ?? ""}
                  onChange={(e) =>
                    setTractorForm({
                      ...tractorForm,
                      selfWeightTons: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Màu sơn */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Màu sơn
                </label>
                <input
                  type="text"
                  placeholder="VD: Trắng xanh, Đỏ..."
                  value={tractorForm.color || ""}
                  onChange={(e) =>
                    setTractorForm({ ...tractorForm, color: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Số khung */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Số khung (VIN)
                </label>
                <input
                  type="text"
                  placeholder="VD: RNHT24FCAKC092906"
                  value={tractorForm.chassisNo || ""}
                  onChange={(e) =>
                    setTractorForm({ ...tractorForm, chassisNo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Số máy */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Số máy
                </label>
                <input
                  type="text"
                  placeholder="VD: ISGE440076234886"
                  value={tractorForm.engineNo || ""}
                  onChange={(e) =>
                    setTractorForm({ ...tractorForm, engineNo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Hạn đăng kiểm */}
              <div>
                <label className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hạn đăng kiểm</span>
                </label>
                <input
                  type="date"
                  value={tractorForm.inspectionExpirationDate || ""}
                  onChange={(e) =>
                    setTractorForm({
                      ...tractorForm,
                      inspectionExpirationDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Ngày cấp phép liên vận */}
              <div>
                <label className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ngày cấp phép liên vận</span>
                </label>
                <input
                  type="date"
                  value={tractorForm.transitLicenseDate || ""}
                  onChange={(e) =>
                    setTractorForm({
                      ...tractorForm,
                      transitLicenseDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Trạng thái */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Trạng thái vận hành
                </label>
                <select
                  value={tractorForm.status || "Đang hoạt động"}
                  onChange={(e) =>
                    setTractorForm({ ...tractorForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="Bảo dưỡng">Bảo dưỡng</option>
                  <option value="Chờ đăng kiểm">Chờ đăng kiểm</option>
                  <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                </select>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="font-medium text-foreground mb-1 block">
                Ghi chú điều vận
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú về tình trạng kỹ thuật, phù hiệu xe..."
                value={tractorForm.notes || ""}
                onChange={(e) =>
                  setTractorForm({ ...tractorForm, notes: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. FORM RƠ-MOÓC (TRAILER)                              */}
        {/* ======================================================== */}
        {target.type === "TRAILER" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Biển số rơ-moóc */}
              <div>
                <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Container className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Biển số rơ-moóc</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 92R-00544"
                  value={trailerForm.trailerNo}
                  onChange={(e) =>
                    setTrailerForm({
                      ...trailerForm,
                      trailerNo: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Đơn vị sở hữu */}
              <div>
                <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đơn vị sở hữu / Nhà xe</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={trailerForm.vendorId}
                  onChange={(e) =>
                    setTrailerForm({ ...trailerForm, vendorId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    -- Chọn Đơn vị / Nhà xe --
                  </option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.code ? `(${v.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Chủng loại moóc */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Chủng loại moóc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="trailer-types-list"
                  placeholder="VD: RMX 3T, RMS 3T..."
                  value={trailerForm.modelType || ""}
                  onChange={(e) =>
                    setTrailerForm({ ...trailerForm, modelType: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <datalist id="trailer-types-list">
                  {COMMON_TRAILER_TYPES.map((t) => (
                    <option key={t} value={t.split(" ")[0]} />
                  ))}
                </datalist>
              </div>

              {/* Nhà sản xuất */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Nhà sản xuất
                </label>
                <input
                  type="text"
                  placeholder="VD: THACO, Tân Thanh..."
                  value={trailerForm.manufacturer || ""}
                  onChange={(e) =>
                    setTrailerForm({
                      ...trailerForm,
                      manufacturer: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Năm sản xuất */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Năm sản xuất
                </label>
                <input
                  type="number"
                  min="1990"
                  max="2030"
                  value={trailerForm.productionYear || ""}
                  onChange={(e) =>
                    setTrailerForm({
                      ...trailerForm,
                      productionYear: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Tải trọng chở hàng */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Tải trọng chở hàng (Tấn)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="VD: 30.20"
                  value={trailerForm.payloadCapacityTons ?? ""}
                  onChange={(e) =>
                    setTrailerForm({
                      ...trailerForm,
                      payloadCapacityTons: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tự trọng moóc */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Tự trọng moóc (Tấn)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="VD: 6.20"
                  value={trailerForm.curbWeightTons ?? ""}
                  onChange={(e) =>
                    setTrailerForm({
                      ...trailerForm,
                      curbWeightTons: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Màu sơn */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Màu sơn
                </label>
                <input
                  type="text"
                  placeholder="VD: Trắng xanh, Đỏ..."
                  value={trailerForm.paintColor || ""}
                  onChange={(e) =>
                    setTrailerForm({ ...trailerForm, paintColor: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Số khung moóc */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Số khung moóc
                </label>
                <input
                  type="text"
                  placeholder="VD: RN0PD339AKC000968"
                  value={trailerForm.chassisNo || ""}
                  onChange={(e) =>
                    setTrailerForm({ ...trailerForm, chassisNo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tuyến liên vận */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Tuyến liên vận
                </label>
                <select
                  value={trailerForm.transitRoute || "Nội địa"}
                  onChange={(e) =>
                    setTrailerForm({ ...trailerForm, transitRoute: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMON_TRANSIT_ROUTES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Hạn đăng kiểm */}
              <div>
                <label className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hạn đăng kiểm</span>
                </label>
                <input
                  type="date"
                  value={trailerForm.inspectionExpirationDate || ""}
                  onChange={(e) =>
                    setTrailerForm({
                      ...trailerForm,
                      inspectionExpirationDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Trạng thái */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Tình trạng đăng kiểm / Vận hành
                </label>
                <select
                  value={trailerForm.status || "Đang hoạt động"}
                  onChange={(e) =>
                    setTrailerForm({ ...trailerForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="4. Chưa nhập đăng kiểm">
                    Chưa nhập đăng kiểm
                  </option>
                  <option value="1. Quá hạn đăng kiểm">Quá hạn đăng kiểm</option>
                  <option value="Bảo dưỡng">Bảo dưỡng</option>
                  <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                </select>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="font-medium text-foreground mb-1 block">
                Ghi chú nghiệp vụ
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú về vỏ lốp, trục gánh, kiểm định..."
                value={trailerForm.notes || ""}
                onChange={(e) =>
                  setTrailerForm({ ...trailerForm, notes: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. FORM TÀI XẾ (DRIVER)                                 */}
        {/* ======================================================== */}
        {target.type === "DRIVER" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Mã tài xế */}
              <div>
                <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>Mã tài xế</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: D_0001, 0410005"
                  value={driverForm.driverId}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, driverId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Họ và tên */}
              <div className="sm:col-span-2">
                <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <span>Họ và tên tài xế</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trần Công Đồng"
                  value={driverForm.fullName}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Đội xe / Nhà xe */}
              <div className="sm:col-span-2">
                <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đội xe / Nhà xe trực thuộc</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={driverForm.vendorId}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, vendorId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    -- Chọn Đơn vị / Nhà xe --
                  </option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.code ? `(${v.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Điện thoại hotline</span>
                </label>
                <input
                  type="tel"
                  placeholder="VD: 0933467021"
                  value={driverForm.phone || ""}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Số GPLX */}
              <div>
                <label className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Số GPLX (Hạng FC)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 490103001189"
                  value={driverForm.licenseNo || ""}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, licenseNo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Ngày sinh */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={driverForm.birthday || ""}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, birthday: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Giới tính */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Giới tính
                </label>
                <select
                  value={driverForm.gender || "Nam"}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Số CCCD */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Số CCCD / CMND
                </label>
                <input
                  type="text"
                  placeholder="VD: 049075021700"
                  value={driverForm.citizenId || ""}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, citizenId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Ngày cấp CCCD */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Ngày cấp CCCD
                </label>
                <input
                  type="date"
                  value={driverForm.citizenIssueDate || ""}
                  onChange={(e) =>
                    setDriverForm({
                      ...driverForm,
                      citizenIssueDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Số hộ chiếu */}
              <div>
                <label className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                  <span>Số hộ chiếu (Chạy Cam - Lào)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: C9513641"
                  value={driverForm.passportNo || ""}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, passportNo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Ngày cấp hộ chiếu */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Ngày cấp hộ chiếu
                </label>
                <input
                  type="date"
                  value={driverForm.passportIssueDate || ""}
                  onChange={(e) =>
                    setDriverForm({
                      ...driverForm,
                      passportIssueDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quê quán */}
            <div>
              <label className="font-medium text-foreground mb-1 block">
                Quê quán / Địa bàn hoạt động
              </label>
              <input
                type="text"
                placeholder="VD: TT Núi Thành, Huyện Núi Thành, Quảng Nam"
                value={driverForm.hometown || ""}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, hometown: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tình trạng hồ sơ */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Tình trạng hồ sơ
                </label>
                <select
                  value={driverForm.status || "Đang hoạt động"}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="4. Chưa nhập hộ chiếu">
                    Chưa nhập hộ chiếu
                  </option>
                  <option value="1. Quá hạn hộ chiếu">Quá hạn hộ chiếu</option>
                  <option value="Tạm nghỉ">Tạm nghỉ</option>
                </select>
              </div>

              {/* Tọa độ GPS */}
              <div>
                <label className="font-medium text-foreground mb-1 block">
                  Tọa độ GPS nhà riêng / Trạm
                </label>
                <input
                  type="text"
                  placeholder="VD: 15.4345098,108.6471982"
                  value={driverForm.gpsCoordinates || ""}
                  onChange={(e) =>
                    setDriverForm({
                      ...driverForm,
                      gpsCoordinates: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="font-medium text-foreground mb-1 block">
                Ghi chú điều vận
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú kinh nghiệm tuyến, loại xe quen chạy..."
                value={driverForm.notes || ""}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, notes: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Nút hành động Lưu / Hủy */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={submitting}
          >
            {isEdit ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
