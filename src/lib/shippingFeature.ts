import "server-only";
export function publicShippingQuoteEnabled() {
  return (
    process.env.PUBLIC_SHIPPING_QUOTES_ENABLED === "true" &&
    process.env.ENVIATODO_MODE === "production" &&
    !/apiqa|sandbox/i.test(process.env.ENVIATODO_BASE_URL || "") &&
    Boolean(process.env.ENVIATODO_TOKEN)
  );
}
