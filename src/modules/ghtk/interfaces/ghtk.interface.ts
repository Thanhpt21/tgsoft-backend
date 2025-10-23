export interface GHTKFeeDetail {
  name: string;
  fee: number;
}

export interface GHTKShipFeeResponse {
  success: boolean;
  message?: string;
  fee?: {
    name: string;
    fee: number;
    insurance_fee: number;
    include_vat: string;
    cost_id: string;
    delivery: boolean;
    delivery_date?: string;
  };
}

export interface GHTKCreateOrderResponse {
  success: boolean;
  message?: string;
  order?: {
    partner_id: string;
    label: string;
    area: number;
    fee: number;
    insurance_fee: number;
    estimated_pick_time: string;
    estimated_deliver_time: string;
    status_id: number;
    tracking_id: number;
    sorting_code: string;
    status: string;
    status_text: string;
    tracking_link: string;
    partner_code?: string;
  };
}

export interface GHTKOrderRequestData {
  id: string;
  pick_name: string;
  pick_address: string;
  pick_province: string;
  pick_district: string;
  pick_ward: string;
  pick_tel: string;
  pick_money: number;
  name: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  hamlet: string;
  tel: string;
  email: string;
  note: string;
  value: number;
  is_freeship: string;
  pick_option: string;
  transport?: string;
  deliver_option?: string;
  pick_date?: string;
}

export interface GHTKCreateOrderPayload {
  order: GHTKOrderRequestData;
  products: Array<{
    name: string;
    weight: number;
    quantity: number;
    price: number;
    product_code?: string;
  }>;
}

export interface GHTKTrackingResponse {
  success: boolean;
  message?: string;
  order?: {
    label: string;
    status: string;
    status_text: string;
    created: string;
    modified: string;
    pick_date?: string;
    deliver_date?: string;
    customer_fullname: string;
    customer_tel: string;
    address: string;
    storage_day: number;
    ship_money: number;
    insurance: number;
    value: number;
    weight: number;
    pick_money: number;
    total_pay: number;
    is_freeship: number;
  };
}

export interface GHTKCancelOrderResponse {
  success: boolean;
  message?: string;
}