"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, PackageCheck, Send, Truck } from "lucide-react";
import { ENVIATODO_PACKAGE_PRESETS, ENVIATODO_PROVIDERS } from "@/src/lib/enviatodo/constants";

type AddressForm = {
  zip_code: string;
  state: string;
  city: string;
  colony: string;
};

type RateOption = {
  uuid?: string;
  provider?: string;
  provider_id?: string | number;
  service?: string;
  service_name?: string;
  provider_service_id?: string | number;
  transport_type?: string;
  estimated_date?: string;
  total?: string | number;
  subtotal?: string | number;
  iva?: string | number;
};

const defaultOrigin: AddressForm = {
  zip_code: "72000",
  state: "Puebla",
  city: "Puebla",
  colony: "Centro",
};

const defaultDestination: AddressForm = {
  zip_code: "",
  state: "",
  city: "",
  colony: "",
};

function money(value: unknown) {
  return `$${Number(value || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`;
}

function pickRates(data: unknown): RateOption[] {
  const value = data as { data?: { rates?: RateOption[] }; rates?: RateOption[] };
  if (Array.isArray(value?.data?.rates)) return value.data.rates;
  if (Array.isArray(value?.rates)) return value.rates;
  return [];
}

function fieldLabel(field: keyof AddressForm) {
  if (field === "zip_code") return "CODIGO POSTAL";
  if (field === "state") return "ESTADO";
  if (field === "city") return "CIUDAD";
  return "COLONIA";
}

export function EnviatodoQuoteWidget() {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [preset, setPreset] = useState<keyof typeof ENVIATODO_PACKAGE_PRESETS>("PLAYERA");
  const [providerServiceId, setProviderServiceId] = useState("");
  const [rates, setRates] = useState<RateOption[]>([]);
  const [selectedRate, setSelectedRate] = useState<RateOption | null>(null);
  const [orderResult, setOrderResult] = useState<unknown>(null);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  const packagePreset = useMemo(() => ENVIATODO_PACKAGE_PRESETS[preset], [preset]);
  const selectedProvider = useMemo(
    () => ENVIATODO_PROVIDERS.find((item) => String(item.provider_service_id) === providerServiceId),
    [providerServiceId],
  );

  function updateAddress(type: "origin" | "destination", field: keyof AddressForm, value: string) {
    const nextValue = field === "zip_code" ? value.replace(/\D/g, "").slice(0, 5) : value;
    const setter = type === "origin" ? setOrigin : setDestination;
    setter((current) => ({ ...current, [field]: nextValue }));
  }

  async function quote() {
    if (!/^\d{5}$/.test(origin.zip_code) || !/^\d{5}$/.test(destination.zip_code)) {
      setMessage("Origen y destino requieren codigo postal de 5 digitos.");
      return;
    }

    setLoading("rates");
    setMessage("");
    setRates([]);
    setSelectedRate(null);
    setOrderResult(null);

    try {
      const response = await fetch("/api/enviatodo/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          package: packagePreset,
          quantity: 1,
          shipping_type: "1",
          ...(selectedProvider ? { provider_id: selectedProvider.provider_id, provider_service_id: selectedProvider.provider_service_id } : {}),
        }),
      });
      const json = await response.json();
      if (!response.ok || json.ok === false) throw new Error(json.message || "No pudimos cotizar el envio.");
      const nextRates = pickRates(json.data);
      setRates(nextRates);
      setMessage(nextRates.length ? "" : "EnviaTodo no devolvio opciones para ese trayecto.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cotizar el envio.");
    } finally {
      setLoading("");
    }
  }

  async function createGuide(rate: RateOption) {
    if (!rate.uuid || !rate.provider_id || !rate.provider_service_id) {
      setMessage("La cotizacion no incluye uuid/provider para crear guia.");
      return;
    }

    setLoading(`create-${rate.uuid}`);
    setMessage("");
    setOrderResult(null);
    try {
      const response = await fetch("/api/enviatodo/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: rate.uuid,
          provider_id: String(rate.provider_id),
          provider_service_id: String(rate.provider_service_id),
          insurance: false,
        }),
      });
      const json = await response.json();
      if (!response.ok || json.ok === false) throw new Error(json.message || "No pudimos crear la guia.");
      setSelectedRate(rate);
      setOrderResult(json.data);
      setMessage("Guia creada con EnviaTodo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos crear la guia.");
    } finally {
      setLoading("");
    }
  }

  return (
    <section className="enviatodo-widget" aria-label="Cotizador EnviaTodo">
      <div className="enviatodo-widget-head">
        <div>
          <p className="section-label">ENVIATODO API V2 / SANDBOX</p>
          <h2>Cotizador de envio.</h2>
        </div>
        <Truck size={28} />
      </div>

      {message ? <p className="enviatodo-message">{message}</p> : null}

      <div className="enviatodo-form-grid">
        <fieldset>
          <legend>Origen</legend>
          {(Object.keys(origin) as Array<keyof AddressForm>).map((field) => (
            <label key={field}>
              <span>{fieldLabel(field)}</span>
              <input value={origin[field]} onChange={(event) => updateAddress("origin", field, event.target.value)} />
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Destino</legend>
          {(Object.keys(destination) as Array<keyof AddressForm>).map((field) => (
            <label key={field}>
              <span>{fieldLabel(field)}</span>
              <input value={destination[field]} onChange={(event) => updateAddress("destination", field, event.target.value)} placeholder={field === "zip_code" ? "68146" : ""} />
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Paquete</legend>
          <label>
            <span>PRESET</span>
            <select value={preset} onChange={(event) => setPreset(event.target.value as keyof typeof ENVIATODO_PACKAGE_PRESETS)}>
              <option value="PLAYERA">PLAYERA</option>
              <option value="SUDADERA">SUDADERA</option>
            </select>
          </label>
          <div className="package-metrics">
            <span>{packagePreset.length}L</span>
            <span>{packagePreset.width}W</span>
            <span>{packagePreset.height}H</span>
            <span>{packagePreset.weight}KG</span>
          </div>
        </fieldset>

        <fieldset>
          <legend>Servicio</legend>
          <label>
            <span>PAQUETERIA OPCIONAL</span>
            <select value={providerServiceId} onChange={(event) => setProviderServiceId(event.target.value)}>
              <option value="">Todas las paqueterias</option>
              {ENVIATODO_PROVIDERS.map((item) => (
                <option key={`${item.provider_id}-${item.provider_service_id}`} value={item.provider_service_id}>
                  {item.name} / {item.transport}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={quote} disabled={loading === "rates"}>
            {loading === "rates" ? <Loader2 size={15} className="spin-icon" /> : <Send size={15} />}
            Cotizar envio
          </button>
        </fieldset>
      </div>

      {rates.length ? (
        <div className="enviatodo-rates">
          {rates.map((rate, index) => (
            <article key={rate.uuid || `${rate.provider_id}-${rate.provider_service_id}-${index}`}>
              <span>{rate.provider || "Paqueteria"}</span>
              <h3>{rate.service || rate.service_name || "Servicio disponible"}</h3>
              <p>{rate.transport_type || "Transporte"} / {rate.estimated_date || "Tiempo por confirmar"}</p>
              <dl>
                <div><dt>Total</dt><dd>{money(rate.total)}</dd></div>
                <div><dt>provider_id</dt><dd>{rate.provider_id}</dd></div>
                <div><dt>service_id</dt><dd>{rate.provider_service_id}</dd></div>
              </dl>
              <button type="button" onClick={() => createGuide(rate)} disabled={loading === `create-${rate.uuid}`}>
                {loading === `create-${rate.uuid}` ? <Loader2 size={15} className="spin-icon" /> : <PackageCheck size={15} />}
                Crear guia
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {orderResult ? (
        <div className="enviatodo-success">
          <CheckCircle2 size={18} />
          <span>{selectedRate?.provider || "EnviaTodo"} / {selectedRate?.service || selectedRate?.service_name || "Guia generada"}</span>
        </div>
      ) : null}
    </section>
  );
}
