import { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';

export function useProducts(backendStatus, notify) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingWrite, setLoadingWrite] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'name-asc', 'name-desc', 'price-asc', 'price-desc', 'newest'

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (e) {
      if (notify) notify('error', 'Failed to retrieve products list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [backendStatus]);

  const handleCreateProduct = async (productData) => {
    setLoadingWrite(true);
    try {
      const created = await apiService.createProduct(productData);
      setProducts(prev => [created, ...prev]);
      if (notify) notify('success', `Created product "${created.name}" successfully.`);
      return true;
    } catch (error) {
      if (notify) notify('error', 'Failed to publish new product.');
      return false;
    } finally {
      setLoadingWrite(false);
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    setLoadingWrite(true);
    try {
      const updated = await apiService.updateProduct(id, productData);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      if (notify) notify('success', `Updated product details successfully.`);
      return true;
    } catch (error) {
      if (notify) notify('error', 'Failed to update product details.');
      return false;
    } finally {
      setLoadingWrite(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    setLoadingWrite(true);
    try {
      const success = await apiService.deleteProduct(id);
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        if (notify) notify('warning', `Deleted product from catalog.`);
        return true;
      }
      throw new Error('Deletion failed');
    } catch (error) {
      if (notify) notify('error', 'Failed to delete product from catalog.');
      return false;
    } finally {
      setLoadingWrite(false);
    }
  };

  // Derive categories list dynamically
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Compute filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          p.name.toLowerCase().includes(query) || 
          (p.description && p.description.toLowerCase().includes(query)) ||
          p.category.toLowerCase().includes(query);
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        // fallback to newest (simulation by ID sorting or created date)
        return String(b.id).localeCompare(String(a.id));
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

  return {
    products: filteredProducts,
    allRawProducts: products, // raw un-filtered list for select views
    loading,
    loadingWrite,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    createProduct: handleCreateProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    refreshProducts: fetchProducts
  };
}
