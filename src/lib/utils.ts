export const formatPrice = (price: number) => {
  price = price / 100;
  return price.toFixed(2);
}