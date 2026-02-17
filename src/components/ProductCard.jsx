import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white shadow-lg hover:shadow-2xl transition-all rounded-xl overflow-hidden flex flex-col">
      <div className="relative w-full h-64">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-graysoft flex items-center justify-center">
            <span className="text-gray-400">Pas d'image</span>
          </div>
        )}
        {product.on_sale && (
          <span className="absolute top-3 left-3 bg-gold text-white px-3 py-1 rounded-full font-bold text-sm">
            SALE
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading text-lg text-dark mb-2">{product.name}</h3>
        <p className="text-gray-500 mb-4 line-clamp-2">
          {product.short_description}
        </p>
        <div className="mt-auto flex justify-between items-center">
          <span className="text-lg font-bold text-dark">{product.price} €</span>
          <button className="bg-gold text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition">
            Voir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
