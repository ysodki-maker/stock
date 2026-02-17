import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
function App() {
  return (
    <ProductProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
        </Routes>
      </Router>
    </ProductProvider>
  );
}

export default App;
