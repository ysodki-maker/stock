import { useContext, useEffect } from "react";
import { ProductContext } from "../context/ProductContext";
import TableProducts from "./TableProducts";
import GridProducts from "./GridProducts";
const EnArrivageProducts = ({ viewMode }) => {
  const { products, loading, error, fetchEnArrivageProducts } =
    useContext(ProductContext);

  useEffect(() => {
    fetchEnArrivageProducts(1); // récupère les produits en arrivage dès le montage
  }, [fetchEnArrivageProducts]);

  if (loading) return <p>Chargement des produits...</p>;
  if (error) return <p>Erreur: {error}</p>;
  if (!products.length) return <p>Aucun produit en arrivage pour le moment.</p>;
  const getMeta = (product, metaKey) => {
    const meta = product.meta?.find((m) => m.meta_key === metaKey);
    return meta?.meta_value;
  };
  return (
    <>
      {viewMode === "table" ? (
        <TableProducts filteredProducts={products} getMeta={getMeta} />
      ) : (
        <GridProducts filteredProducts={products} getMeta={getMeta} />
      )}
    </>
  );
};

export default EnArrivageProducts;
