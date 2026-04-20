import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import ProductPDFPage from "./components/ProductPDFPage";
import DolibarrSync from './components/DolibarrSync';
function App() {
  return (
    <ProductProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/pdf" element={<ProductPDFPage />} />
          <Route path="/dolibarr" element={<DolibarrSync/>}/>
        </Routes>
      </Router>
    </ProductProvider>
  );
}

export default App;
