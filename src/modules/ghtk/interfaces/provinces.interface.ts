export interface ProvinceOpenAPI {
  code: string;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
  districts?: DistrictOpenAPI[];
}

export interface DistrictOpenAPI {
  code: string;
  name: string;
  codename: string;
  division_type: string;
  short_codename: string;
  province_code: string;
  wards?: WardOpenAPI[];
}

export interface WardOpenAPI {
  code: string;
  name: string;
  codename: string;
  division_type: string;
  short_codename: string;
  district_code: string;
}