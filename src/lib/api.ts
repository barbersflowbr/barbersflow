export async function addBooking(barbeariaId: string, booking: any) {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barbeariaId, ...booking }),
  });
  if (!response.ok) throw new Error('Failed to add booking');
  return response.json();
}

export async function updateBookingStatus(id: string, status: string) {
  const response = await fetch('/api/bookings/update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  if (!response.ok) throw new Error('Failed to update booking status');
  return response.json();
}

export async function deleteBookingFromDb(id: string) {
  const response = await fetch('/api/bookings/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error('Failed to delete booking');
  return response.json();
}
