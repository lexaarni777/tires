// src/utils/validators.js
export const phoneRegex = /^\+?[0-9]{10,15}$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(phone) {
  return phoneRegex.test(phone);
}
export function validateEmail(email) {
  return emailRegex.test(email);
}
