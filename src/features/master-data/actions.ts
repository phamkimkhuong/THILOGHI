"use server";

import {
  getRoadRatesDetailedList,
  getCustomersDetailedList,
  getVendorsDetailedList,
  getLocationsDetailedList,
  getCommoditiesDetailedList,
  getFleetDetailedList,
  getMasterRegions,
} from "@/server/modules/master-data/master-data.service";

export async function getRoadRatesAction(search?: string) {
  try {
    const list = await getRoadRatesDetailedList({ search });
    return { success: true, data: list };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải bảng giá cước",
    };
  }
}

export async function getCustomersAndVendorsAction(search?: string) {
  try {
    const [customers, vendors] = await Promise.all([
      getCustomersDetailedList({ search }),
      getVendorsDetailedList({ search }),
    ]);
    return { success: true, customers, vendors };
  } catch (err) {
    return {
      success: false,
      customers: [],
      vendors: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục khách hàng",
    };
  }
}

export async function getLocationsAction(search?: string, regionId?: string) {
  try {
    const [locations, regions] = await Promise.all([
      getLocationsDetailedList({ search, regionId }),
      getMasterRegions(),
    ]);
    return { success: true, locations, regions };
  } catch (err) {
    return {
      success: false,
      locations: [],
      regions: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải địa điểm",
    };
  }
}

export async function getCommoditiesAction(search?: string) {
  try {
    const list = await getCommoditiesDetailedList({ search });
    return { success: true, data: list };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục mặt hàng",
    };
  }
}

export async function getFleetAction(limit?: number) {
  try {
    const fleet = await getFleetDetailedList(limit);
    return { success: true, fleet };
  } catch (err) {
    return {
      success: false,
      fleet: { tractors: [], trailers: [], drivers: [] },
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục đội xe",
    };
  }
}
