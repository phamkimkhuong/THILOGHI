import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

export interface TractorFleetItem {
  tractorNo: string;
  vendorId: string;
  vendorName: string;
  vendorShortName?: string;
  modelType?: string;
  transitRoute?: string;
  transitLicenseDate?: string;
  productionYear?: number;
  chassisNo?: string;
  engineNo?: string;
  selfWeightTons?: number;
  loadCapacityTons?: number;
  color?: string;
  inspectionExpirationDate?: string;
  attachmentUrl?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface TrailerFleetItem {
  trailerNo: string;
  vendorId: string;
  vendorName: string;
  vendorShortName?: string;
  modelType?: string;
  transitRoute?: string;
  transitLicenseDate?: string;
  manufacturer?: string;
  productionYear?: number;
  chassisNo?: string;
  curbWeightTons?: number;
  payloadCapacityTons?: number;
  paintColor?: string;
  inspectionExpirationDate?: string;
  attachmentUrl?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface DriverFleetItem {
  driverId: string;
  vendorId: string;
  vendorName: string;
  vendorShortName?: string;
  fullName: string;
  gender?: string;
  birthday?: string;
  licenseNo?: string;
  citizenId?: string;
  citizenIssueDate?: string;
  passportNo?: string;
  passportIssueDate?: string;
  phone?: string;
  nationality?: string;
  hometown?: string;
  gpsCoordinates?: string;
  address?: string;
  avatarUrl?: string;
  notes?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Lấy danh sách đội xe (752 đầu kéo, 873 rơ-moóc, 669 tài xế)
 */
export async function getFleetDetailedList(limit = 1000): Promise<{
  tractors: TractorFleetItem[];
  trailers: TrailerFleetItem[];
  drivers: DriverFleetItem[];
}> {
  const [tractorsRes, trailersRes, driversRes] = await Promise.all([
    pool.query(
      `SELECT 
        t.tractor_no as "tractorNo",
        t.vendor_id as "vendorId",
        COALESCE(p.short_name, p.partner_name, t.vendor_id) as "vendorName",
        p.short_name as "vendorShortName",
        t.model_type as "modelType",
        t.transit_route as "transitRoute",
        t.transit_license_date as "transitLicenseDate",
        t.production_year as "productionYear",
        t.chassis_no as "chassisNo",
        t.engine_no as "engineNo",
        t.self_weight_tons as "selfWeightTons",
        t.load_capacity_tons as "loadCapacityTons",
        t.color,
        t.inspection_expiration_date as "inspectionExpirationDate",
        t.attachment_url as "attachmentUrl",
        t.notes,
        t.status,
        t.created_at as "createdAt"
      FROM tractors t
      LEFT JOIN partners p ON t.vendor_id = p.partner_id
      ORDER BY t.tractor_no ASC 
      LIMIT $1`,
      [limit]
    ),
    pool.query(
      `SELECT 
        tr.trailer_no as "trailerNo",
        tr.vendor_id as "vendorId",
        COALESCE(p.short_name, p.partner_name, tr.vendor_id) as "vendorName",
        p.short_name as "vendorShortName",
        tr.model_type as "modelType",
        tr.transit_route as "transitRoute",
        tr.transit_license_date as "transitLicenseDate",
        tr.manufacturer,
        tr.production_year as "productionYear",
        tr.chassis_no as "chassisNo",
        tr.curb_weight_tons as "curbWeightTons",
        tr.payload_capacity_tons as "payloadCapacityTons",
        tr.paint_color as "paintColor",
        tr.inspection_expiration_date as "inspectionExpirationDate",
        tr.attachment_url as "attachmentUrl",
        tr.notes,
        tr.status,
        tr.created_at as "createdAt"
      FROM trailers tr
      LEFT JOIN partners p ON tr.vendor_id = p.partner_id
      ORDER BY tr.trailer_no ASC 
      LIMIT $1`,
      [limit]
    ),
    pool.query(
      `SELECT 
        d.driver_id as "driverId",
        d.vendor_id as "vendorId",
        COALESCE(p.short_name, p.partner_name, d.vendor_id) as "vendorName",
        p.short_name as "vendorShortName",
        d.full_name as "fullName",
        d.gender,
        d.birthday,
        d.license_no as "licenseNo",
        d.citizen_id as "citizenId",
        d.citizen_issue_date as "citizenIssueDate",
        d.passport_no as "passportNo",
        d.passport_issue_date as "passportIssueDate",
        d.phone,
        d.nationality,
        d.hometown,
        d.gps_coordinates as "gpsCoordinates",
        d.address,
        d.avatar_url as "avatarUrl",
        d.notes,
        d.status,
        d.is_active as "isActive",
        d.created_at as "createdAt"
      FROM drivers d
      LEFT JOIN partners p ON d.vendor_id = p.partner_id
      ORDER BY d.driver_id ASC 
      LIMIT $1`,
      [limit]
    ),
  ]);

  return {
    tractors: tractorsRes.rows.map((r) => ({
      tractorNo: r.tractorNo,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      vendorShortName: r.vendorShortName || undefined,
      modelType: r.modelType || undefined,
      transitRoute: r.transitRoute || undefined,
      transitLicenseDate: r.transitLicenseDate ? new Date(r.transitLicenseDate).toISOString() : undefined,
      productionYear: r.productionYear != null ? Number(r.productionYear) : undefined,
      chassisNo: r.chassisNo || undefined,
      engineNo: r.engineNo || undefined,
      selfWeightTons: r.selfWeightTons != null ? Number(r.selfWeightTons) : undefined,
      loadCapacityTons: r.loadCapacityTons != null ? Number(r.loadCapacityTons) : undefined,
      color: r.color || undefined,
      inspectionExpirationDate: r.inspectionExpirationDate ? new Date(r.inspectionExpirationDate).toISOString() : undefined,
      attachmentUrl: r.attachmentUrl || undefined,
      notes: r.notes || undefined,
      status: r.status || "Đang hoạt động",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
    trailers: trailersRes.rows.map((r) => ({
      trailerNo: r.trailerNo,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      vendorShortName: r.vendorShortName || undefined,
      modelType: r.modelType || undefined,
      transitRoute: r.transitRoute || undefined,
      transitLicenseDate: r.transitLicenseDate ? new Date(r.transitLicenseDate).toISOString() : undefined,
      manufacturer: r.manufacturer || undefined,
      productionYear: r.productionYear != null ? Number(r.productionYear) : undefined,
      chassisNo: r.chassisNo || undefined,
      curbWeightTons: r.curbWeightTons != null ? Number(r.curbWeightTons) : undefined,
      payloadCapacityTons: r.payloadCapacityTons != null ? Number(r.payloadCapacityTons) : undefined,
      paintColor: r.paintColor || undefined,
      inspectionExpirationDate: r.inspectionExpirationDate ? new Date(r.inspectionExpirationDate).toISOString() : undefined,
      attachmentUrl: r.attachmentUrl || undefined,
      notes: r.notes || undefined,
      status: r.status || "Đang hoạt động",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
    drivers: driversRes.rows.map((r) => ({
      driverId: r.driverId,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      vendorShortName: r.vendorShortName || undefined,
      fullName: r.fullName,
      gender: r.gender || "Nam",
      birthday: r.birthday ? new Date(r.birthday).toISOString() : undefined,
      licenseNo: r.licenseNo || undefined,
      citizenId: r.citizenId || undefined,
      citizenIssueDate: r.citizenIssueDate ? new Date(r.citizenIssueDate).toISOString() : undefined,
      passportNo: r.passportNo || undefined,
      passportIssueDate: r.passportIssueDate ? new Date(r.passportIssueDate).toISOString() : undefined,
      phone: r.phone || undefined,
      nationality: r.nationality || "Việt Nam",
      hometown: r.hometown || undefined,
      gpsCoordinates: r.gpsCoordinates || undefined,
      address: r.address || undefined,
      avatarUrl: r.avatarUrl || undefined,
      notes: r.notes || undefined,
      status: r.status || "Đang hoạt động",
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
  };
}

export interface SaveTractorInput {
  tractorNo: string;
  originalTractorNo?: string;
  vendorId: string;
  modelType?: string;
  transitRoute?: string;
  transitLicenseDate?: string | null;
  productionYear?: number | null;
  chassisNo?: string;
  engineNo?: string;
  selfWeightTons?: number | null;
  loadCapacityTons?: number | null;
  color?: string;
  inspectionExpirationDate?: string | null;
  notes?: string;
  status?: string;
}

export async function saveTractorService(input: SaveTractorInput, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "OPERATIONS", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  const tractorNo = (input.tractorNo || "").trim().toUpperCase();
  const originalTractorNo = (input.originalTractorNo || "").trim().toUpperCase();
  const vendorId = (input.vendorId || "").trim();

  if (!tractorNo) throw new Error("Vui lòng nhập biển số xe đầu kéo.");
  if (!vendorId) throw new Error("Vui lòng chọn đơn vị sở hữu / Nhà xe.");

  const vCheck = await pool.query("SELECT vendor_id FROM vendors WHERE vendor_id = $1", [vendorId]);
  if (!vCheck.rows.length) throw new Error(`Đơn vị / Nhà xe [${vendorId}] không tồn tại.`);

  const isEdit = Boolean(originalTractorNo);

  if (isEdit) {
    if (tractorNo !== originalTractorNo) {
      const dup = await pool.query("SELECT tractor_no FROM tractors WHERE tractor_no = $1", [tractorNo]);
      if (dup.rows.length) throw new Error(`Biển số xe đầu kéo [${tractorNo}] đã tồn tại trong hệ thống.`);
    }

    await pool.query(
      `UPDATE tractors SET
        tractor_no = $1,
        vendor_id = $2,
        model_type = $3,
        transit_route = $4,
        transit_license_date = $5,
        production_year = $6,
        chassis_no = $7,
        engine_no = $8,
        self_weight_tons = $9,
        load_capacity_tons = $10,
        color = $11,
        inspection_expiration_date = $12,
        notes = $13,
        status = $14
      WHERE tractor_no = $15`,
      [
        tractorNo,
        vendorId,
        input.modelType || null,
        input.transitRoute || null,
        input.transitLicenseDate || null,
        input.productionYear || null,
        input.chassisNo || null,
        input.engineNo || null,
        input.selfWeightTons || null,
        input.loadCapacityTons || null,
        input.color || null,
        input.inspectionExpirationDate || null,
        input.notes || null,
        input.status || "Đang hoạt động",
        originalTractorNo,
      ]
    );

    return { success: true, message: `Cập nhật đầu kéo [${tractorNo}] thành công.` };
  } else {
    const dup = await pool.query("SELECT tractor_no FROM tractors WHERE tractor_no = $1", [tractorNo]);
    if (dup.rows.length) throw new Error(`Biển số xe đầu kéo [${tractorNo}] đã tồn tại trong hệ thống.`);

    await pool.query(
      `INSERT INTO tractors (
        tractor_no, vendor_id, model_type, transit_route, transit_license_date,
        production_year, chassis_no, engine_no, self_weight_tons, load_capacity_tons,
        color, inspection_expiration_date, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        tractorNo,
        vendorId,
        input.modelType || null,
        input.transitRoute || null,
        input.transitLicenseDate || null,
        input.productionYear || null,
        input.chassisNo || null,
        input.engineNo || null,
        input.selfWeightTons || null,
        input.loadCapacityTons || null,
        input.color || null,
        input.inspectionExpirationDate || null,
        input.notes || null,
        input.status || "Đang hoạt động",
      ]
    );

    return { success: true, message: `Thêm mới đầu kéo [${tractorNo}] thành công.` };
  }
}

export async function deleteTractorService(tractorNo: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "OPERATIONS", "PRICING_MANAGER"]);
  const tNo = (tractorNo || "").trim();
  if (!tNo) throw new Error("Biển số đầu kéo không hợp lệ.");
  await pool.query("DELETE FROM tractors WHERE tractor_no = $1", [tNo]);
  return { success: true, message: `Đã xóa đầu kéo [${tNo}] thành công.` };
}

export interface SaveTrailerInput {
  trailerNo: string;
  originalTrailerNo?: string;
  vendorId: string;
  modelType?: string;
  transitRoute?: string;
  transitLicenseDate?: string | null;
  manufacturer?: string;
  productionYear?: number | null;
  chassisNo?: string;
  curbWeightTons?: number | null;
  payloadCapacityTons?: number | null;
  paintColor?: string;
  inspectionExpirationDate?: string | null;
  notes?: string;
  status?: string;
}

export async function saveTrailerService(input: SaveTrailerInput, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "OPERATIONS", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  const trailerNo = (input.trailerNo || "").trim().toUpperCase();
  const originalTrailerNo = (input.originalTrailerNo || "").trim().toUpperCase();
  const vendorId = (input.vendorId || "").trim();

  if (!trailerNo) throw new Error("Vui lòng nhập biển số rơ-moóc.");
  if (!vendorId) throw new Error("Vui lòng chọn đơn vị sở hữu / Nhà xe.");

  const vCheck = await pool.query("SELECT vendor_id FROM vendors WHERE vendor_id = $1", [vendorId]);
  if (!vCheck.rows.length) throw new Error(`Đơn vị / Nhà xe [${vendorId}] không tồn tại.`);

  const isEdit = Boolean(originalTrailerNo);

  if (isEdit) {
    if (trailerNo !== originalTrailerNo) {
      const dup = await pool.query("SELECT trailer_no FROM trailers WHERE trailer_no = $1", [trailerNo]);
      if (dup.rows.length) throw new Error(`Biển số rơ-moóc [${trailerNo}] đã tồn tại trong hệ thống.`);
    }

    await pool.query(
      `UPDATE trailers SET
        trailer_no = $1,
        vendor_id = $2,
        model_type = $3,
        transit_route = $4,
        transit_license_date = $5,
        manufacturer = $6,
        production_year = $7,
        chassis_no = $8,
        curb_weight_tons = $9,
        payload_capacity_tons = $10,
        paint_color = $11,
        inspection_expiration_date = $12,
        notes = $13,
        status = $14
      WHERE trailer_no = $15`,
      [
        trailerNo,
        vendorId,
        input.modelType || null,
        input.transitRoute || null,
        input.transitLicenseDate || null,
        input.manufacturer || null,
        input.productionYear || null,
        input.chassisNo || null,
        input.curbWeightTons || null,
        input.payloadCapacityTons || null,
        input.paintColor || null,
        input.inspectionExpirationDate || null,
        input.notes || null,
        input.status || "Đang hoạt động",
        originalTrailerNo,
      ]
    );

    return { success: true, message: `Cập nhật rơ-moóc [${trailerNo}] thành công.` };
  } else {
    const dup = await pool.query("SELECT trailer_no FROM trailers WHERE trailer_no = $1", [trailerNo]);
    if (dup.rows.length) throw new Error(`Biển số rơ-moóc [${trailerNo}] đã tồn tại trong hệ thống.`);

    await pool.query(
      `INSERT INTO trailers (
        trailer_no, vendor_id, model_type, transit_route, transit_license_date,
        manufacturer, production_year, chassis_no, curb_weight_tons, payload_capacity_tons,
        paint_color, inspection_expiration_date, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        trailerNo,
        vendorId,
        input.modelType || null,
        input.transitRoute || null,
        input.transitLicenseDate || null,
        input.manufacturer || null,
        input.productionYear || null,
        input.chassisNo || null,
        input.curbWeightTons || null,
        input.payloadCapacityTons || null,
        input.paintColor || null,
        input.inspectionExpirationDate || null,
        input.notes || null,
        input.status || "Đang hoạt động",
      ]
    );

    return { success: true, message: `Thêm mới rơ-moóc [${trailerNo}] thành công.` };
  }
}

export async function deleteTrailerService(trailerNo: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "OPERATIONS", "PRICING_MANAGER"]);
  const trNo = (trailerNo || "").trim();
  if (!trNo) throw new Error("Biển số rơ-moóc không hợp lệ.");
  await pool.query("DELETE FROM trailers WHERE trailer_no = $1", [trNo]);
  return { success: true, message: `Đã xóa rơ-moóc [${trNo}] thành công.` };
}

export interface SaveDriverInput {
  driverId: string;
  originalDriverId?: string;
  vendorId: string;
  fullName: string;
  gender?: string;
  birthday?: string | null;
  licenseNo?: string;
  citizenId?: string;
  citizenIssueDate?: string | null;
  passportNo?: string;
  passportIssueDate?: string | null;
  phone?: string;
  nationality?: string;
  hometown?: string;
  gpsCoordinates?: string;
  address?: string;
  notes?: string;
  status?: string;
  isActive?: boolean;
}

export async function saveDriverService(input: SaveDriverInput, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "OPERATIONS", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  const driverId = (input.driverId || "").trim();
  const originalDriverId = (input.originalDriverId || "").trim();
  const fullName = (input.fullName || "").trim();
  const vendorId = (input.vendorId || "").trim();

  if (!driverId) throw new Error("Vui lòng nhập mã tài xế.");
  if (!fullName) throw new Error("Vui lòng nhập họ và tên tài xế.");
  if (!vendorId) throw new Error("Vui lòng chọn đội xe / Nhà xe trực thuộc.");

  const vCheck = await pool.query("SELECT vendor_id FROM vendors WHERE vendor_id = $1", [vendorId]);
  if (!vCheck.rows.length) throw new Error(`Đơn vị / Nhà xe [${vendorId}] không tồn tại.`);

  const isEdit = Boolean(originalDriverId);

  if (isEdit) {
    if (driverId !== originalDriverId) {
      const dup = await pool.query("SELECT driver_id FROM drivers WHERE driver_id = $1", [driverId]);
      if (dup.rows.length) throw new Error(`Mã tài xế [${driverId}] đã tồn tại trong hệ thống.`);
    }

    await pool.query(
      `UPDATE drivers SET
        driver_id = $1,
        vendor_id = $2,
        full_name = $3,
        gender = $4,
        birthday = $5,
        license_no = $6,
        citizen_id = $7,
        citizen_issue_date = $8,
        passport_no = $9,
        passport_issue_date = $10,
        phone = $11,
        nationality = $12,
        hometown = $13,
        gps_coordinates = $14,
        address = $15,
        notes = $16,
        status = $17,
        is_active = $18
      WHERE driver_id = $19`,
      [
        driverId,
        vendorId,
        fullName,
        input.gender || "Nam",
        input.birthday || null,
        input.licenseNo || null,
        input.citizenId || null,
        input.citizenIssueDate || null,
        input.passportNo || null,
        input.passportIssueDate || null,
        input.phone || null,
        input.nationality || "Việt Nam",
        input.hometown || null,
        input.gpsCoordinates || null,
        input.address || null,
        input.notes || null,
        input.status || "Đang hoạt động",
        input.isActive ?? true,
        originalDriverId,
      ]
    );

    return { success: true, message: `Cập nhật tài xế [${fullName}] thành công.` };
  } else {
    const dup = await pool.query("SELECT driver_id FROM drivers WHERE driver_id = $1", [driverId]);
    if (dup.rows.length) throw new Error(`Mã tài xế [${driverId}] đã tồn tại trong hệ thống.`);

    await pool.query(
      `INSERT INTO drivers (
        driver_id, vendor_id, full_name, gender, birthday, license_no,
        citizen_id, citizen_issue_date, passport_no, passport_issue_date,
        phone, nationality, hometown, gps_coordinates, address, notes, status, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        driverId,
        vendorId,
        fullName,
        input.gender || "Nam",
        input.birthday || null,
        input.licenseNo || null,
        input.citizenId || null,
        input.citizenIssueDate || null,
        input.passportNo || null,
        input.passportIssueDate || null,
        input.phone || null,
        input.nationality || "Việt Nam",
        input.hometown || null,
        input.gpsCoordinates || null,
        input.address || null,
        input.notes || null,
        input.status || "Đang hoạt động",
        input.isActive ?? true,
      ]
    );

    return { success: true, message: `Thêm mới tài xế [${fullName}] thành công.` };
  }
}

export async function deleteDriverService(driverId: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "OPERATIONS", "PRICING_MANAGER"]);
  const dId = (driverId || "").trim();
  if (!dId) throw new Error("Mã tài xế không hợp lệ.");
  await pool.query("DELETE FROM drivers WHERE driver_id = $1", [dId]);
  return { success: true, message: `Đã xóa tài xế [${dId}] thành công.` };
}

export async function getFleetVendorsService() {
  const res = await pool.query(`
    SELECT 
      v.vendor_id as "id", 
      COALESCE(p.short_name, p.partner_name, v.vendor_id) as "name", 
      p.short_name as "code" 
    FROM vendors v 
    JOIN partners p ON v.vendor_id = p.partner_id 
    ORDER BY p.partner_name ASC
  `);
  return res.rows as { id: string; name: string; code?: string }[];
}

