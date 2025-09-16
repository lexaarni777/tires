const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');
export function minimg(product) {
console.log('product',product)

  if (product?.images && product.images.length > 0) {
    const featured = product.images.find((img) => img.is_featured_image);
    return featured
      ? `${API_URL}${featured.image_path}`
      : `${API_URL}${product.images[0].image_path}`;
  }

  // ДОБАВЛЕНО: если нет индивидуальных — использовать model_images
  if (product?.model_images && product.model_images.length > 0) {
    const featured = product.model_images.find((img) => img.is_featured_image);
    return featured
      ? `${API_URL}${featured.image_path}`
      : `${API_URL}${product.model_images[0].image_path}`;
  }

  return "https://via.placeholder.com/220x220";
};