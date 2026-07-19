export const isEmail = (email: string): boolean => {
  return /^\S+@\S+\.\S+$/.test(email);
};
