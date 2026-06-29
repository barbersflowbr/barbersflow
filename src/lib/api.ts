export interface BookingPayload {
  barberId: string;
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  status?: string;
}

const defaultHeaders = { 'Content-Type': 'application/json' };

async function handleApiResponse(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || response.statusText || 'API request failed';
    throw new Error(message);
  }
  return payload;
}

export async function addBooking(barbeariaId: string, booking: BookingPayload) {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ barbeariaId, ...booking }),
  });
  return handleApiResponse(response);
}

export async function checkBookingAvailability(params: {
  barbeariaId: string;
  barberId: string;
  date: string;
  time: string;
}) {
  const response = await fetch('/api/bookings/check', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(params),
  });
  return handleApiResponse(response);
}

export async function updateBookingStatus(id: string, status: string) {
  const response = await fetch('/api/bookings/update-status', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ id, status }),
  });
  return handleApiResponse(response);
}

export async function deleteBookingFromDb(id: string) {
  const response = await fetch('/api/bookings/delete', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ id }),
  });
  return handleApiResponse(response);
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  slug: string,
  plan: string,
) {
  const response = await fetch('/api/email/welcome', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ email, name, slug, plan }),
  });
  return handleApiResponse(response);
}

export async function createCheckoutSession(
  planName: string,
  price: number | string,
  title: string,
  email?: string,
) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ planName, price, title, email }),
  });
  return handleApiResponse(response);
}
