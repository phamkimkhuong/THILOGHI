/**
 * Master Data Service Facade
 * 
 * Kiến trúc tách nhỏ Domain Services (DDD Service Layer) + Mẫu hình Facade:
 * - master-options.service.ts: Dropdowns, danh mục tra cứu dùng chung (regions, customers, locations, commodities, vendors)
 * - location.service.ts: Quản lý 160 địa điểm, cảng biển, depot, ICD (CRUD, audit, soft-delete check)
 * - commodity.service.ts: Quản lý danh mục hàng hóa logistics, quy cách kỹ thuật & mục đích
 * - fleet.service.ts: Quản lý đội xe vận tải (đầu kéo, rơ-moóc, tài xế)
 * - road-rates.service.ts: Quản lý 130 biểu cước mua đường bộ & kiểm soát trùng lấn hiệu lực
 * 
 * Barrel này re-export 100% types, constants và functions để đảm bảo Zero-Breaking Changes
 * cho các Server Actions và Test Suites hiện hữu.
 */

export * from "./master-options.service";
export * from "./location.service";
export * from "./commodity.service";
export * from "./fleet.service";
export * from "./road-rates.service";
export * from "./service-package.service";
export * from "./equipment-types.service";
export * from "./user-management.service";
