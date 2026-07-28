import "server-only";
import { enviatodoRequest } from "./client";
import type {
  EnviatodoAddress,
  EnviatodoCreateOrderRequest,
  EnviatodoCreateOrderResponse,
  EnviatodoPackage,
  EnviatodoQuoteRequest,
  EnviatodoQuoteResponse,
} from "./types";

export const getZipCode = (zipCode: string) => enviatodoRequest(`Api/get_zip_code/${encodeURIComponent(zipCode)}`);
export const getClientBalance = () => enviatodoRequest("Api/get_client_balance");
export const getAddresses = () => enviatodoRequest("Api/get_address");
export const getAddressById = (id: string | number) => enviatodoRequest(`Api/get_address_by_id/${encodeURIComponent(String(id))}`);
export const getAddressesByType = (typeId: string | number) => enviatodoRequest(`Api/get_address_by_type_id/${encodeURIComponent(String(typeId))}`);
export const addAddress = (data: EnviatodoAddress) => enviatodoRequest("Api/add_address", { method: "POST", body: data });
export const deleteAddress = (id: string | number) => enviatodoRequest(`Api/delete_address_by_id/${encodeURIComponent(String(id))}`);

export const getPackages = () => enviatodoRequest("Api/get_packages");
export const getPackageById = (id: string | number) => enviatodoRequest(`Api/get_package_by_id/${encodeURIComponent(String(id))}`);
export const addPackage = (data: EnviatodoPackage) => enviatodoRequest("Api/add_package/", { method: "POST", body: data });
export const deletePackage = (id: string | number) => enviatodoRequest(`Api/delete_package/${encodeURIComponent(String(id))}`);

export const getParcelServices = () => enviatodoRequest("Api/get_parcel_service");
export const getProviderServices = () => enviatodoRequest("Api/provider_services");

export const getRates = (payload: EnviatodoQuoteRequest | unknown) => enviatodoRequest<EnviatodoQuoteResponse>("Api/rates_client", { method: "POST", body: payload });
export const createOrder = (payload: EnviatodoCreateOrderRequest | unknown) => enviatodoRequest<EnviatodoCreateOrderResponse>("Api/create_order", { method: "POST", body: payload });
export const cancelOrder = (payload: unknown) => enviatodoRequest("Api/cancel_order", { method: "POST", body: payload });

export const downloadGuides = (guideIds: unknown) => enviatodoRequest("Api/download_guides", { method: "POST", body: guideIds });
export const downloadGuideBinaries = (guideIds: unknown) => enviatodoRequest("Api/download_guide_binaries", { method: "POST", body: guideIds });

export const getUserTransactions = () => enviatodoRequest("Api/user_transactions");
export const getOrders = () => enviatodoRequest("Api/get_orders");
export const getOrderByTrxId = (trxId: string | number) => enviatodoRequest(`Api/get_order/${encodeURIComponent(String(trxId))}`);
export const getOrdersFilter = (filter: unknown) => enviatodoRequest("Api/get_orders_filter", { method: "POST", body: filter });

export const getOrdersForPickupByClientId = (payload: unknown) => enviatodoRequest("Api/get_orders_for_pickup_by_client_id", { method: "POST", body: payload });
export const addPickup = (payload: unknown) => enviatodoRequest("Api/add_pickup", { method: "POST", body: payload });
export const cancelPickup = (payload: unknown) => enviatodoRequest("Api/cancel_pickup", { method: "POST", body: payload });

export const getProductTypeCatalog = () => enviatodoRequest("Api/get_catalog/pts");
export const getPackageTypeCatalog = () => enviatodoRequest("Api/get_catalog/pkt");

export const quoteShipment = getRates;
export const createShipmentOrder = createOrder;
export const filterOrders = getOrdersFilter;
export const downloadGuideFileId = downloadGuides;
