export type EnviatodoPrimitive = string | number | boolean | null;
export type EnviatodoJson = EnviatodoPrimitive | EnviatodoJson[] | { [key: string]: EnviatodoJson };
export type EnviatodoRecord = Record<string, unknown>;

export type EnviatodoAddress = EnviatodoRecord & {
  id?: string | number;
  type_id?: string | number;
  zip_code?: string;
  postal_code?: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  colony?: string;
  city?: string;
  municipality?: string;
  state?: string;
  country?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
};

export type EnviatodoPackage = EnviatodoRecord & {
  id?: string | number;
  height?: number | string;
  width?: number | string;
  length?: number | string;
  weight?: number | string;
  real_weight?: number | string;
  volumetric_weight?: number | string;
  bill_weight?: number | string;
  package_content?: string;
  product_type?: string;
  unit_type?: string;
  amount_pkg?: string | number;
  product_quantity?: string | number;
};

export type EnviatodoProvider = {
  provider_id: number;
  name: string;
  provider_service_id: number;
  transport: string;
};

export type EnviatodoQuoteRequest = {
  type?: "order" | string;
  quotes: EnviatodoRecord & {
    shipping_type: string;
    quantity: number;
    provider_id?: string | number;
    provider_service_id?: string | number;
    origin: EnviatodoAddress;
    destination: EnviatodoAddress;
    package: EnviatodoPackage;
  };
};

export type EnviatodoRateOption = EnviatodoRecord & {
  uuid?: string;
  provider?: string;
  provider_id?: string | number;
  service?: string;
  service_name?: string;
  provider_service_id?: string | number;
  transport_type?: string;
  total?: number | string;
  subtotal?: number | string;
  iva?: number | string;
  estimated_date?: string;
};

export type EnviatodoQuoteResponse = EnviatodoRecord & {
  rates?: EnviatodoRateOption[];
  data?: EnviatodoRecord & { rates?: EnviatodoRateOption[] };
};

export type EnviatodoCreateOrderRequest = {
  order: {
    type: "create_order" | string;
    data: {
      uuid: string;
      detail: {
        provider_id: string | number;
        provider_service_id: string | number;
        insurance: boolean;
      } & EnviatodoRecord;
    } & EnviatodoRecord;
  };
};

export type EnviatodoCreateOrderResponse = EnviatodoRecord & {
  trx_id?: string | number;
  guide_id?: string | number;
  tracking_id?: string;
  tracking_link?: string;
  data?: EnviatodoRecord;
};

export type EnviatodoOrderStatus = {
  name: string;
  type: "ORDER" | "PICKUP";
};

export type EnviatodoApiError = {
  ok: false;
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

export type EnviatodoResult<T = unknown> = {
  ok: boolean;
  configured: boolean;
  sandbox: boolean;
  status: number;
  data?: T;
  message?: string;
  contentType?: string;
};
