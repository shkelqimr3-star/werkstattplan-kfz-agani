export const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR"
});

export const number = new Intl.NumberFormat("de-DE");

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function whatsappLink(phone: string, message: string) {
  const normalized = phone.replace(/[^+\d]/g, "");
  return `https://wa.me/${normalized.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
}
