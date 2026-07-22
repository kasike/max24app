import React, { useState, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FileText,
  DollarSign,
  TrendingUp,
  X,
  FileSpreadsheet,
  Layers,
  History,
  Barcode,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  Camera,
  UploadCloud,
  FileJson
} from 'lucide-react';
import { Product, Category, Supplier } from '../types';
import { exportToCSV } from '../utils/export';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  suppliers?: Supplier[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onImportProducts?: (importedList: Omit<Product, 'id'>[], onProgress?: (percent: number) => void) => Promise<void>;
}

export default function Inventory({ 
  products, 
  categories,
  suppliers = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onImportProducts
}: InventoryProps) {
  
  // Filters & query states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Form Modal toggle states
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  // State variables for categories manager modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // States for stock manual logging (In / Out transactions)
  const [isStockLogOpen, setIsStockLogOpen] = useState(false);
  const [stockLogProduct, setStockLogProduct] = useState<Product | null>(null);
  const [logType, setLogType] = useState<'In' | 'Out'>('In'); // In = Entrada, Out = Salida
  const [logQuantity, setLogQuantity] = useState('');
  const [logComment, setLogComment] = useState('');
  
  // Virtual Stock Movement logs
  const [movementHistory, setMovementHistory] = useState<{
    id: string;
    productName: string;
    type: 'Entrada' | 'Salida';
    quantity: number;
    comment: string;
    date: string;
  }[]>(() => {
    const saved = localStorage.getItem('max24_inventory_movements');
    return saved ? JSON.parse(saved) : [
      { id: 'm-1', productName: 'Aceite de Girasol 1.5L', type: 'Entrada', quantity: 20, comment: 'Suministro inicial del proveedor', date: '2026-06-19T14:23:00Z' },
      { id: 'm-2', productName: 'Arroz Integral Extra 1Kg', type: 'Salida', quantity: 3, comment: 'Ajuste por merma (bolsa defectuosa)', date: '2026-06-20T09:12:00Z' }
    ];
  });

  const saveMovements = (logs: typeof movementHistory) => {
    setMovementHistory(logs);
    localStorage.setItem('max24_inventory_movements', JSON.stringify(logs));
  };

  // Current edited / new product fields
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]?.name || 'Alimentos');
  const [formPrice, setFormPrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');
  const [formUnit, setFormUnit] = useState('Unidades');
  const [formMargin, setFormMargin] = useState(''); // Profit percentage margin
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSupplierId, setFormSupplierId] = useState('');
  const [isNewCategoryOnFly, setIsNewCategoryOnFly] = useState(false);
  const [newCategoryNameOnFly, setNewCategoryNameOnFly] = useState('');

  // Quick Restock slider/modal
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState('');

  // Actualizador de Costo Rápido States
  const [quickCostSearch, setQuickCostSearch] = useState('');
  const [quickSelectedProd, setQuickSelectedProd] = useState<Product | null>(null);
  const [quickCostInput, setQuickCostInput] = useState('');
  const [quickNewPriceCalculated, setQuickNewPriceCalculated] = useState(0);
  const [quickCostMessage, setQuickCostMessage] = useState('');

  const handleQuickCostUpdate = () => {
    if (!quickSelectedProd) return;
    const nextCost = parseFloat(quickCostInput);
    if (isNaN(nextCost) || nextCost < 0) {
      setQuickCostMessage("⚠️ Ingresa un costo válido (mayor o igual a 0)");
      return;
    }

    const currentMargin = quickSelectedProd.cost > 0 
      ? ((quickSelectedProd.price - quickSelectedProd.cost) / quickSelectedProd.cost) 
      : 0.35; // Default to 35% margin
    const nextPrice = Math.round(nextCost * (1 + currentMargin));

    // Compile updated product
    const updated: Product = {
      ...quickSelectedProd,
      cost: nextCost,
      price: nextPrice
    };

    // Trigger parent callback
    onUpdateProduct(updated);

    // Register a log inside movement history
    const logMov = {
      id: `m-${Date.now()}`,
      productName: quickSelectedProd.name,
      type: 'Entrada' as const,
      quantity: 0,
      comment: `Ajuste costo p/margen: de $${quickSelectedProd.cost} a $${nextCost} (Venta: $${quickSelectedProd.price} a $${nextPrice})`,
      date: new Date().toISOString()
    };
    saveMovements([logMov, ...movementHistory]);

    setQuickCostMessage(`✅ ¡Costo actualizado! Costo: $${nextCost} | Venta: $${nextPrice}`);
    
    // Reset quick cost form values
    setQuickSelectedProd(null);
    setQuickCostInput('');
    setQuickCostSearch('');
    setQuickNewPriceCalculated(0);
    
    // Clear message after 5 seconds
    setTimeout(() => setQuickCostMessage(''), 5000);
  };

  // Import products database feature states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [parsedProducts, setParsedProducts] = useState<Omit<Product, 'id'>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,SKU,Codigo_Barras,Nombre_Producto,Categoria,Costo_Unitario,Precio_Venta,Stock_Actual,Stock_Minimo,Unidad_Medida\nPROD-001,,Yerba Mate Premium 1Kg,Almacen,1500,2200,45,10,Unidades\nPROD-002,7790895000451,Galletitas Sonrisas,Almacen,400,600,100,20,Unidades\nPROD-003,,Leche Entera Larga Vida 1L,Lacteos,800,1100,30,8,Litros";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "max24_plantilla_productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const parseImportFile = (text: string, fileType: 'csv' | 'json') => {
    try {
      if (fileType === 'json') {
        const parsed = JSON.parse(text);
        const dataArr = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || []);
        if (!Array.isArray(dataArr)) {
          setImportError("El archivo JSON debe contener un arreglo de productos.");
          return;
        }
        
        const list: Omit<Product, 'id'>[] = [];
        for (let i = 0; i < dataArr.length; i++) {
          const item = dataArr[i];
          const name = item.name || item.nombre || item.Nombre_Producto || item.nombre_producto || item.productName || '';
          if (!name) continue;
          
          list.push({
            name: String(name).trim(),
            sku: String(item.sku || item.codigo || item.Codigo || item.SKU || `SKU-AUTO-${Date.now()}-${i}`).trim(),
            barcode: item.barcode || item.Codigo_Barras || item.codigo_barras || item.codigoBarras || undefined,
            category: String(item.category || item.categoria || item.Categoria || 'Alimentos').trim(),
            price: parseFloat(item.price || item.precio || item.Precio_Venta || item.precio_venta || '0') || 0,
            cost: parseFloat(item.cost || item.costo || item.Costo_Unitario || item.costo_unitario || '0') || 0,
            stock: parseFloat(item.stock || item.stock_actual || item.stockActual || item.cantidad || '0') || 0,
            minStock: parseFloat(item.minStock || item.minstock || item.stock_minimo || item.stockMinimo || '5') || 5,
            unit: String(item.unit || item.unidad || item.Unidad_Medida || item.unidad_medida || 'Unidades').trim()
          });
        }
        
        if (list.length === 0) {
          setImportError("No se encontraron productos válidos en el archivo JSON.");
        } else {
          setParsedProducts(list);
          setImportError('');
        }
      } else {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          setImportError("El archivo CSV está vacío o no contiene filas.");
          return;
        }
        
        const headerLine = lines[0];
        const delimiter = headerLine.includes(';') ? ';' : ',';
        
        const splitCSVLine = (line: string) => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        
        const headers = splitCSVLine(headerLine).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
        
        const getIndex = (aliases: string[]) => {
          return headers.findIndex(h => aliases.some(alias => h === alias || h.replace(/\s+/g, '_') === alias || h.replace(/\s+/g, '') === alias));
        };
        
        const idxName = getIndex(['nombre_producto', 'nombre', 'name', 'productname', 'producto', 'articulo', 'artículo']);
        const idxSku = getIndex(['sku', 'codigo', 'código', 'cod', 'id']);
        const idxBarcode = getIndex(['codigo_barras', 'codigobarras', 'barcode', 'código_de_barras', 'bar_code', 'barras']);
        const idxCategory = getIndex(['categoria', 'categoría', 'category', 'rubro', 'grupo']);
        const idxPrice = getIndex(['precio_venta', 'precioventa', 'precio', 'price', 'preciodeventa', 'venta']);
        const idxCost = getIndex(['costo_unitario', 'costounitario', 'costo', 'cost', 'costounit', 'costodecompra']);
        const idxStock = getIndex(['stock_actual', 'stockactual', 'stock', 'cantidad', 'stock_actual', 'cant']);
        const idxMinStock = getIndex(['stock_minimo', 'stockminimo', 'minstock', 'stock_mínimo', 'min_stock', 'minimo']);
        const idxUnit = getIndex(['unidad_medida', 'unidadmedida', 'unidad', 'unit', 'unidaddemedida', 'medida']);
        
        if (idxName === -1) {
          setImportError("No se pudo detectar la columna del nombre del producto (ej: 'Nombre_Producto', 'Nombre' o 'Name').");
          return;
        }
        
        const list: Omit<Product, 'id'>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const columns = splitCSVLine(line).map(c => c.replace(/^"|"$/g, '').trim());
          if (columns.length === 0 || !columns[idxName]) continue;
          
          const rawPrice = idxPrice !== -1 && columns[idxPrice] ? columns[idxPrice] : '0';
          const rawCost = idxCost !== -1 && columns[idxCost] ? columns[idxCost] : '0';
          const rawStock = idxStock !== -1 && columns[idxStock] ? columns[idxStock] : '0';
          const rawMinStock = idxMinStock !== -1 && columns[idxMinStock] ? columns[idxMinStock] : '5';
          
          list.push({
            name: columns[idxName],
            sku: idxSku !== -1 && columns[idxSku] ? columns[idxSku] : `SKU-AUTO-${Date.now()}-${i}`,
            barcode: idxBarcode !== -1 && columns[idxBarcode] ? columns[idxBarcode] : undefined,
            category: idxCategory !== -1 && columns[idxCategory] ? columns[idxCategory] : 'Alimentos',
            price: parseFloat(rawPrice.replace(/[^0-9.-]/g, '')) || 0,
            cost: parseFloat(rawCost.replace(/[^0-9.-]/g, '')) || 0,
            stock: parseFloat(rawStock.replace(/[^0-9.-]/g, '')) || 0,
            minStock: parseFloat(rawMinStock.replace(/[^0-9.-]/g, '')) || 5,
            unit: idxUnit !== -1 && columns[idxUnit] ? columns[idxUnit] : 'Unidades'
          });
        }
        
        if (list.length === 0) {
          setImportError("No se encontraron productos válidos en el archivo CSV.");
        } else {
          setParsedProducts(list);
          setImportError('');
        }
      }
    } catch (err) {
      console.error(err);
      setImportError("Error al interpretar el archivo. Asegúrate de que el formato sea correcto.");
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setImportError('');
    setImportSuccess('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'json') {
      setImportError("Solo se permiten archivos con formato .csv o .json");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseImportFile(text, extension === 'json' ? 'json' : 'csv');
    };
    reader.onerror = () => {
      setImportError("Error al leer el archivo.");
    };
    reader.readAsText(file);
  };

  const executeBulkImport = async () => {
    if (parsedProducts.length === 0) return;
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      if (onImportProducts) {
        await onImportProducts(parsedProducts, (percent) => {
          setImportProgress(percent);
        });
      } else {
        for (let i = 0; i < parsedProducts.length; i++) {
          await onAddProduct(parsedProducts[i]);
          setImportProgress(Math.round(((i + 1) / parsedProducts.length) * 100));
        }
      }
      
      setImportSuccess(`🎉 Se importaron con éxito ${parsedProducts.length} productos a la base de datos.`);
      setParsedProducts([]);
      setImportProgress(null);
      
      const logMov = {
        id: `m-${Date.now()}`,
        productName: 'Importación de Base de Datos',
        type: 'Entrada' as const,
        quantity: parsedProducts.reduce((acc, p) => acc + p.stock, 0),
        comment: `Importación de catálogo externo (${parsedProducts.length} productos)`,
        date: new Date().toISOString()
      };
      saveMovements([logMov, ...movementHistory]);
      
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportSuccess('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setImportError("Error al guardar la lista de productos importados.");
    } finally {
      setIsImporting(false);
    }
  };

  // Derived analysis levels
  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock <= 0).length;
    const valuation = products.reduce((acc, p) => acc + (p.stock * p.cost), 0);
    return { total, lowStock, outOfStock, valuation };
  }, [products]);

  // Filtered array
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.barcode && p.barcode.includes(searchQuery));
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Open form for Create
  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedProductId(null);
    setFormName('');
    setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBarcode(`779${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setFormCategory(categories[0]?.name || 'Alimentos');
    setFormCost('');
    setFormMargin('35'); // Default standard margin
    setFormPrice('');
    setFormStock('');
    setFormMinStock('10');
    setFormUnit('Unidades');
    setFormImageUrl('');
    setFormSupplierId('');
    setIsNewCategoryOnFly(false);
    setNewCategoryNameOnFly('');
    setIsOpenForm(true);
  };

  // Open form for Edit
  const handleOpenEdit = (p: Product) => {
    setFormMode('edit');
    setSelectedProductId(p.id);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode || '');
    setFormCategory(p.category);
    setFormCost(p.cost.toString());
    setFormPrice(p.price.toString());
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setFormUnit(p.unit);
    setFormImageUrl(p.imageUrl || '');
    setFormSupplierId(p.supplierId || '');
    setIsNewCategoryOnFly(false);
    setNewCategoryNameOnFly('');
    
    // Calculate margin back
    if (p.cost > 0) {
      const marginCalculated = Math.round(((p.price - p.cost) / p.cost) * 100);
      setFormMargin(marginCalculated.toString());
    } else {
      setFormMargin('0');
    }
    
    setIsOpenForm(true);
  };

  // Profit Margins helper math updater
  const handleCostChange = (costVal: string) => {
    setFormCost(costVal);
    const costNum = parseFloat(costVal);
    const marginNum = parseFloat(formMargin);
    if (!isNaN(costNum) && !isNaN(marginNum)) {
      const finalPrice = Math.round(costNum * (1 + marginNum / 100));
      setFormPrice(finalPrice.toString());
    }
  };

  const handleMarginChange = (marginVal: string) => {
    setFormMargin(marginVal);
    const costNum = parseFloat(formCost);
    const marginNum = parseFloat(marginVal);
    if (!isNaN(costNum) && !isNaN(marginNum)) {
      const finalPrice = Math.round(costNum * (1 + marginNum / 100));
      setFormPrice(finalPrice.toString());
    }
  };

  const handlePriceChange = (priceVal: string) => {
    setFormPrice(priceVal);
    const costNum = parseFloat(formCost);
    const priceNum = parseFloat(priceVal);
    if (!isNaN(costNum) && costNum > 0 && !isNaN(priceNum)) {
      const marginCalculated = Math.round(((priceNum - costNum) / costNum) * 100);
      setFormMargin(marginCalculated.toString());
    }
  };

  // Barcode quick test generator simulator
  const handleScanSimulation = () => {
    const randomBarcode = `779${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setFormBarcode(randomBarcode);
    setFormSku(`SKU-${randomBarcode.slice(-5)}`);
  };

  // Submit Product Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formSku || !formPrice || !formCost || !formStock) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    const priceNum = parseFloat(formPrice);
    const costNum = parseFloat(formCost);
    const stockNum = parseFloat(formStock);
    const minStockNum = parseFloat(formMinStock) || 0;

    let categoryToUse = formCategory;
    if (isNewCategoryOnFly && newCategoryNameOnFly.trim()) {
      const catClean = newCategoryNameOnFly.trim();
      const existing = categories.find(c => c.name.toLowerCase() === catClean.toLowerCase());
      if (existing) {
        categoryToUse = existing.name;
      } else {
        onAddCategory({ name: catClean, description: 'Creada al registrar producto' });
        categoryToUse = catClean;
      }
    }

    const payload = {
      name: formName,
      sku: formSku,
      barcode: formBarcode || undefined,
      category: categoryToUse,
      price: priceNum,
      cost: costNum,
      stock: stockNum,
      minStock: minStockNum,
      unit: formUnit,
      imageUrl: formImageUrl || undefined,
      supplierId: formSupplierId || undefined
    };

    if (formMode === 'create') {
      onAddProduct(payload);
      // Register custom birth stock logs
      const birthMov = {
        id: `m-${Date.now()}`,
        productName: formName,
        type: 'Entrada' as const,
        quantity: stockNum,
        comment: 'Registro y creación de lote inicial de stock',
        date: new Date().toISOString()
      };
      saveMovements([birthMov, ...movementHistory]);
    } else if (formMode === 'edit' && selectedProductId) {
      onUpdateProduct({
        ...payload,
        id: selectedProductId
      });
    }

    setIsOpenForm(false);
  };

  // Quick Restock submit
  const submitRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !restockAmount) return;

    const added = parseInt(restockAmount);
    if (isNaN(added) || added <= 0) return;

    onUpdateProduct({
      ...restockProduct,
      stock: restockProduct.stock + added
    });

    // Write movement record
    const addedMov = {
      id: `m-${Date.now()}`,
      productName: restockProduct.name,
      type: 'Entrada' as const,
      quantity: added,
      comment: 'Ingreso rápido de mercadería',
      date: new Date().toISOString()
    };
    saveMovements([addedMov, ...movementHistory]);

    setIsRestockOpen(false);
    setRestockAmount('');
    setRestockProduct(null);
  };

  // Submit Inventory manual stock in/out adjustments
  const handleStockAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockLogProduct || !logQuantity) return;

    const qtyVal = parseInt(logQuantity);
    if (isNaN(qtyVal) || qtyVal <= 0) return;

    let nextStock = stockLogProduct.stock;
    if (logType === 'In') {
      nextStock += qtyVal;
    } else {
      nextStock = Math.max(0, stockLogProduct.stock - qtyVal);
    }

    onUpdateProduct({
      ...stockLogProduct,
      stock: nextStock
    });

    // Write movement record
    const adjustMov = {
      id: `m-${Date.now()}`,
      productName: stockLogProduct.name,
      type: logType === 'In' ? ('Entrada' as const) : ('Salida' as const),
      quantity: qtyVal,
      comment: logComment || (logType === 'In' ? 'Ajuste manual de entrada' : 'Ajuste manual de salida (merma/consumo)'),
      date: new Date().toISOString()
    };
    saveMovements([adjustMov, ...movementHistory]);

    setIsStockLogOpen(false);
    setLogQuantity('');
    setLogComment('');
    setStockLogProduct(null);
  };

  // Category submits
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    if (editingCategory) {
      onUpdateCategory({
        id: editingCategory.id,
        name: categoryName,
        description: categoryDesc
      });
    } else {
      onAddCategory({
        name: categoryName,
        description: categoryDesc
      });
    }

    setCategoryName('');
    setCategoryDesc('');
    setEditingCategory(null);
  };

  // Export current inventory list directly to CSV
  const handleExportCSV = () => {
    const records = products.map(p => ({
      SKU: p.sku,
      Codigo_Barras: p.barcode || 'N/A',
      Nombre_Producto: p.name,
      Categoria: p.category,
      Proveedor: suppliers?.find(s => s.id === p.supplierId)?.name || 'Sin Proveedor',
      Costo_Unitario: p.cost,
      Precio_Venta: p.price,
      Stock_Actual: p.stock,
      Stock_Minimo: p.minStock,
      Unidad_Medida: p.unit,
      Valor_Inventario_Costo: p.stock * p.cost,
      Margen_Ganancia: p.cost > 0 ? Math.round(((p.price - p.cost) / p.cost) * 100) : 0
    }));
    exportToCSV('MAX24_Inventario_Stock_Comercial', records);
  };

  return (
    <div className="space-y-6" id="inventory-module-stage">
      
      {/* Top Banner metrics row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="inventory-widgets">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total de Items</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h4 className="text-2xl font-black font-sans text-slate-900 leading-tight">{stats.total}</h4>
            <span className="text-xs text-slate-500 font-medium">artículos</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Bajo Stock</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h4 className="text-2xl font-black font-sans text-red-500 leading-tight">{stats.lowStock}</h4>
            {stats.lowStock > 0 ? (
              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 border border-red-150 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Alerta
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium">saludable</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Sin Stock / Rotas</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h4 className="text-2xl font-black font-sans text-slate-800 leading-tight">{stats.outOfStock}</h4>
            <span className="text-xs text-slate-500 font-medium">agotados</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Valor Total (Costo)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm font-bold text-slate-400">$</span>
            <h4 className="text-2xl font-black font-sans text-orange-600 leading-tight">
              {stats.valuation.toLocaleString('es-AR')}
            </h4>
          </div>
        </div>
      </section>

      {/* Main Title Actions controls header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-sans text-slate-900 tracking-tight leading-none">Control de Inventario</h2>
          <p className="text-xs text-slate-500 mt-1.5 font-sans">Administra los precios, márgenes de ganancia, categorías y realiza entradas o salidas de stock.</p>
        </div>

        {/* Buttons container */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categories button controller */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Configurar Categorías ({categories.length})
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Exportar stock completo a un archivo CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            Exportar CSV
          </button>

          {/* Import Database button */}
          <button
            onClick={() => {
              setParsedProducts([]);
              setImportError('');
              setImportSuccess('');
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Importar base de datos de productos desde otro sistema (CSV o JSON)"
            id="btn-import-products-catalog"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Importar Catálogo
          </button>

          {/* New product creation trigger */}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/15 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Search Filter controller panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xxs flex flex-col sm:flex-row items-center gap-4">
        {/* Search Input bar */}
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre de producto, SKU o usar lector de código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories fast selector pill filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto shrink-0 py-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1 shrink-0">Filtrar:</span>
          {['Todos', ...categories.map(c => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap
                ${selectedCategory === cat 
                  ? 'bg-slate-900 border border-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Items Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xxs">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              Lista de Stock ({filteredProducts.length} items)
            </h3>
            {searchQuery && (
              <span className="text-[10px] font-mono bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                Búsqueda filtrada
              </span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Ningún producto coincide con el filtro / término buscado.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); }}
                className="text-xs font-bold text-orange-500 hover:underline"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 font-mono tracking-wider">
                    <th className="py-3 px-5">Producto / SKU</th>
                    <th className="py-3 px-4">Categoría / Proveedor</th>
                    <th className="py-3 px-4 text-right">Coste / Margen</th>
                    <th className="py-3 px-4 text-right">Precio Venta</th>
                    <th className="py-3 px-4 text-center">Nivel Stock</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 select-none">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.minStock && p.stock > 0;
                    const isOut = p.stock <= 0;
                    const marginPercent = p.cost > 0 ? Math.round(((p.price - p.cost) / p.cost) * 100) : 0;

                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-50/70 transition-all text-xs
                          ${isOut ? 'bg-red-50/35' : ''}
                          ${isLow ? 'bg-amber-50/20' : ''}`}
                      >
                        {/* Name and SKU / Barcode */}
                        <td className="py-2.5 px-5">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-150 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <div className="leading-tight">
                              <span className="font-extrabold text-slate-800 block truncate max-w-[200px]" title={p.name}>
                                {p.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[9px] text-slate-400">
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-500">SKU: {p.sku}</span>
                                {p.barcode && (
                                  <span className="flex items-center gap-0.5 bg-slate-100 px-1 py-0.5 rounded text-slate-500" title="Código de Barra">
                                    <Barcode className="w-2.5 h-2.5 text-slate-400" />
                                    {p.barcode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category / Supplier */}
                        <td className="py-3.5 px-4 text-left leading-tight">
                          <span className="text-slate-600 font-bold block">{p.category}</span>
                          {p.supplierId ? (
                            <span className="text-[10px] text-slate-400 block font-sans mt-0.5" title="Proveedor">
                              {suppliers.find(s => s.id === p.supplierId)?.name || 'Proveedor Desconocido'}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-350 italic block mt-0.5">Sin Proveedor</span>
                          )}
                        </td>

                        {/* Profit margin */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="leading-tight font-mono">
                            <span className="text-slate-500 block text-[11px]">${p.cost.toLocaleString('es-AR')}</span>
                            <span className="text-emerald-600 block text-[10px] font-extrabold mt-0.5 flex items-center justify-end">
                              +{marginPercent}% margin
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-extrabold text-slate-900 font-mono text-xs block">
                            ${p.price.toLocaleString('es-AR')}
                          </span>
                        </td>

                        {/* Stock alert */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`px-2 py-1 rounded-lg text-[11px] font-extrabold font-mono inline-block block
                              ${isOut ? 'bg-red-500/10 text-red-600 border border-red-500/15 animate-pulse' : ''}
                              ${isLow ? 'bg-amber-500/10 text-amber-600 border border-amber-500/15' : ''}
                              ${!isOut && !isLow ? 'bg-slate-100 text-slate-700' : ''}`}
                            >
                              {p.stock} {p.unit.slice(0, 3)}
                            </span>
                            
                            {/* Alert indicators */}
                            {isOut && <span className="text-[8px] font-black text-red-500 font-sans uppercase mt-1 leading-none tracking-wide">Sin Stock</span>}
                            {isLow && <span className="text-[8px] font-black text-amber-500 font-sans uppercase mt-1 leading-none tracking-wide">Stock Crítico</span>}
                          </div>
                        </td>

                        {/* Actions controls button */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Adjust stock button */}
                            <button
                              onClick={() => {
                                setStockLogProduct(p);
                                setLogType('In');
                                setIsStockLogOpen(true);
                              }}
                              className="p-1 px-2.5 bg-slate-150 hover:bg-orange-500 hover:text-slate-950 font-bold text-[10px] text-slate-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Registrar movimiento / Entrada y Salida"
                            >
                              <History className="w-3 h-3 shrink-0" />
                              Ajustar
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Editar producto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (confirm(`¿Dar de baja permanente a ${p.name}?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Dar de baja"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right sidebars column */}
        <div className="space-y-6">
          {/* Actualizador de Costo Rápido Panel */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 text-white space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 font-mono flex items-center justify-between">
              <span>Actualizador Rápido de Costos</span>
              <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold uppercase shrink-0">Express</span>
            </h3>

            <p className="text-[10px] text-slate-400 leading-normal">
              Busca un producto por nombre o código de barra para cambiar su costo. El precio de venta se recalculará automáticamente según su porcentaje de ganancia.
            </p>

            {quickCostMessage && (
              <div className="p-2.5 rounded-xl text-[10px] font-bold leading-normal bg-orange-500/10 border border-orange-500/25 text-orange-350">
                {quickCostMessage}
              </div>
            )}

            {/* Product finder container */}
            <div className="space-y-2 relative">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Escanear o buscar producto</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Escribe nombre o pasa el lector..."
                    value={quickCostSearch}
                    onChange={(e) => {
                      setQuickCostSearch(e.target.value);
                      if (!e.target.value) {
                        setQuickSelectedProd(null);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8.5 pr-3 py-2 text-xs font-semibold text-white placeholder-slate-700 focus:outline-hidden focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Simulate scanning a random product instantly
                    if (products.length > 0) {
                      const randIdx = Math.floor(Math.random() * products.length);
                      const selected = products[randIdx];
                      setQuickSelectedProd(selected);
                      setQuickCostInput(selected.cost.toString());
                      setQuickCostSearch(selected.name);
                      
                      // Audio beep simulation
                      try {
                        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(1200, ctx.currentTime);
                        gain.gain.setValueAtTime(0.2, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.1);
                      } catch (e) {}

                      setQuickCostMessage(`⚡ Lector: ¡Producto "${selected.name}" detectado!`);
                      setTimeout(() => setQuickCostMessage(''), 3000);
                    } else {
                      setQuickCostMessage("⚠️ No hay productos en inventario para simular.");
                    }
                  }}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-750 text-orange-400 rounded-xl text-xs flex items-center justify-center gap-1 transition-all border border-slate-750 shrink-0 cursor-pointer"
                  title="Simular escaneo de barra con el celular o lector"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold font-mono">Escanear</span>
                </button>
              </div>

              {/* Suggestions auto-dropdown */}
              {quickCostSearch && !quickSelectedProd && (
                <div className="absolute top-13 left-0 right-0 max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-1.5 z-30 shadow-2xl space-y-1">
                  {products
                    .filter(p => 
                      p.name.toLowerCase().includes(quickCostSearch.toLowerCase()) || 
                      p.sku.toLowerCase().includes(quickCostSearch.toLowerCase()) ||
                      (p.barcode && p.barcode.includes(quickCostSearch))
                    )
                    .slice(0, 5)
                    .map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setQuickSelectedProd(p);
                          setQuickCostInput(p.cost.toString());
                          setQuickCostSearch(p.name);
                        }}
                        className="w-full text-left p-2.5 bg-transparent hover:bg-slate-900 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div className="font-semibold block truncate pr-2">
                          <span className="text-[9px] font-bold text-orange-400 block uppercase font-mono tracking-wider leading-none">{p.category}</span>
                          <span className="text-white block mt-1 truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">${p.price}</span>
                      </button>
                    ))}
                  {products.filter(p => p.name.toLowerCase().includes(quickCostSearch.toLowerCase()) || p.sku.toLowerCase().includes(quickCostSearch.toLowerCase()) || (p.barcode && p.barcode.includes(quickCostSearch))).length === 0 && (
                    <p className="text-[10px] text-slate-600 text-center py-4 font-semibold">No se encontraron coincidencias</p>
                  )}
                </div>
              )}
            </div>

            {/* Selected active product summary analysis costing fields */}
            {quickSelectedProd && (() => {
              const currentMarginPercent = quickSelectedProd.cost > 0 
                ? Math.round(((quickSelectedProd.price - quickSelectedProd.cost) / quickSelectedProd.cost) * 100) 
                : 35;
              const inputCostNum = parseFloat(quickCostInput);
              const marginFactor = 1 + (currentMarginPercent / 100);
              const calculatedPrice = isNaN(inputCostNum) || inputCostNum < 0 ? 0 : Math.round(inputCostNum * marginFactor);

              return (
                <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800/80 space-y-3 font-sans animate-fade-in text-left">
                  <div className="flex gap-2Items items-start">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/15">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-white truncate leading-none">{quickSelectedProd.name}</p>
                      <span className="text-[9px] font-bold text-slate-500 block font-mono mt-1">Margen Actual: {currentMarginPercent}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono">Nuevo Costo ($ ARS)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={quickCostInput}
                        onChange={(e) => setQuickCostInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-orange-400 font-mono font-black placeholder-slate-700 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1 bg-slate-900/40 p-1.5 rounded-lg border border-slate-850 flex flex-col justify-center text-center">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Nueva Venta Recalculada</span>
                      <strong className="text-sm font-black text-emerald-400 font-mono block mt-0.5">${calculatedPrice.toLocaleString('es-AR')}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickSelectedProd(null);
                        setQuickCostInput('');
                        setQuickCostSearch('');
                      }}
                      className="px-2.5 py-1.5 hover:bg-slate-900 text-slate-400 rounded-lg text-[9px] uppercase font-mono tracking-wider font-black transition-colors shrink-0 cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickCostUpdate}
                      className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-450 text-slate-950 rounded-xl text-[10px] font-mono tracking-tight font-black flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Actualizar Ficha</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Recent movements column log */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 text-white">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 font-mono mb-4 flex items-center justify-between">
              <span>Bitácora de Ajustes</span>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-orange-400 font-bold uppercase shrink-0">Últimos</span>
            </h3>

            {movementHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No se han registrado movimientos de inventario recientemente.</p>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {movementHistory.slice(0, 5).map((log) => {
                  const isIn = log.type === 'Entrada';
                  return (
                    <div key={log.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-start gap-2.5 text-[11px] leading-relaxed">
                      {isIn ? (
                        <ArrowDownCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <ArrowUpCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <strong className="text-slate-200 block truncate">{log.productName}</strong>
                          <span className={`font-mono font-bold shrink-0 text-xs ml-1.5 ${isIn ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isIn ? '+' : '-'}{log.quantity}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs text-[10px] italic">{log.comment}</p>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1">
                          {new Date(log.date).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick stock minimum warning banner */}
          {stats.lowStock > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-950 rounded-3xl space-y-2">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 text-amber-600 font-bold text-[9px] rounded-md uppercase font-mono tracking-wider animate-pulse leading-none">
                <AlertTriangle className="w-3 h-3" /> Alerta de Reabasto
              </span>
              <p className="text-xs font-bold text-amber-800">Tienes {stats.lowStock} productos en mínimos</p>
              <p className="text-[10px] text-amber-700 leading-normal">
                El stock de estos artículos está alcanzando el límite configurado. Haz clic en el botón "Ajustar" para registrar un nuevo ingreso.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE / EDIT PRODUCT */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsOpenForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Package className="text-orange-500" />
              {formMode === 'create' ? 'Registrar Nuevo Producto' : 'Modificar Parámetros de Stock'}
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-sans">Introduce costos, stock y el lector calculará los márgenes correspondientes.</p>

            <form 
              onSubmit={handleSubmitForm} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLElement;
                  if (target && target.tagName === 'INPUT') {
                    e.preventDefault(); // Evita que el escáner de código de barras envíe y cierre el formulario automáticamente
                  }
                }
              }}
              className="space-y-4"
            >
              
              {/* Product generic properties row */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre Comercial del Producto *</label>
                <input
                  type="text"
                  placeholder="ej. Cigarrillos Lights Box x20"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                  required
                />
              </div>

              {/* Product Photo section */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block font-mono">FOTO DEL PRODUCTO (Opcional)</span>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-[9px] font-bold text-red-650 hover:underline cursor-pointer"
                    >
                      Remover Foto
                    </button>
                  )}
                </div>

                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center relative">
                    {formImageUrl ? (
                      <img referrerPolicy="no-referrer" src={formImageUrl} alt="Vista Previa" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Pega la URL de una foto o asocia un archivo..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold focus:outline-hidden text-slate-700"
                    />
                    
                    <div className="flex flex-wrap gap-1.5 items-center text-left">
                      <label className="px-2 py-1 bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 font-bold rounded text-[9px] cursor-pointer shrink-0 transition-colors">
                        Subir Archivo Local...
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setFormImageUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[9px] text-slate-400">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200')}
                        className="px-1.5 py-0.5 border border-slate-200 bg-white text-slate-500 rounded text-[9px] hover:bg-slate-100 cursor-pointer"
                      >
                        Abarrote
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('https://images.unsplash.com/photo-1543083503-03774debb014?auto=format&fit=crop&q=80&w=200')}
                        className="px-1.5 py-0.5 border border-slate-200 bg-white text-slate-500 rounded text-[9px] hover:bg-slate-100 cursor-pointer"
                      >
                        Bebida
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('https://images.unsplash.com/photo-1559811814-e2c57b5e69df?auto=format&fit=crop&q=80&w=200')}
                        className="px-1.5 py-0.5 border border-slate-200 bg-white text-slate-500 rounded text-[9px] hover:bg-slate-100 cursor-pointer"
                      >
                        Lácteo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode scanner scanner emulation row */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block font-mono">BÚSQUEDA / ESCÁNER</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Código de Barra (EAN13)</label>
                    <input
                      type="text"
                      placeholder="ej. 7791234567890"
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">SKU Generado</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ej. ACE-GIR-15"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleScanSimulation}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] rounded-lg tracking-wide uppercase shrink-0 transition-colors flex items-center gap-0.5 cursor-pointer"
                        title="Simular escaneo de código de barra real"
                      >
                        <Barcode className="w-3 h-3 text-orange-400" />
                        Simular
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category, Stock units picker row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Categoría Organizada</label>
                    <button
                      type="button"
                      onClick={() => setIsNewCategoryOnFly(!isNewCategoryOnFly)}
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer focus:outline-hidden"
                    >
                      {isNewCategoryOnFly ? '← Elegir Existente' : '+ Crear Nueva'}
                    </button>
                  </div>
                  {isNewCategoryOnFly ? (
                    <input
                      type="text"
                      value={newCategoryNameOnFly}
                      onChange={(e) => setNewCategoryNameOnFly(e.target.value)}
                      placeholder="Nueva Categoría (ej. Bebidas Cero)"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-orange-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 placeholder-slate-400"
                      required
                    />
                  ) : (
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Unidad de Medida</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Unidades">Unidades</option>
                    <option value="Kg">Kg (Fraccionado)</option>
                    <option value="Litros">Litros</option>
                    <option value="Cajones">Cajones</option>
                  </select>
                </div>
              </div>

              {/* Product Supplier picker */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Proveedor del Producto (Opcional)</label>
                <select
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer text-slate-800"
                >
                  <option value="">Sin Proveedor / Consumo Libre</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contactName ? `(${s.contactName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Financial calculations block costing margin */}
              <div className="p-4 bg-orange-50/20 border border-orange-500/15 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-950 block font-mono mb-3">Análisis de Lucro y Precios</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Costo ($ ARS) *</label>
                    <input
                      type="number"
                      placeholder="950"
                      value={formCost}
                      onChange={(e) => handleCostChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Margen Ganancia (%)</label>
                    <input
                      type="number"
                      placeholder="35"
                      value={formMargin}
                      onChange={(e) => handleMarginChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Venta ($ ARS) *</label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={formPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Stock calculations minimum critical levels */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Stock Actual Inicial *</label>
                  <input
                    type="number"
                    placeholder="25"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Stock de Alerta Mínimo *</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-orange-500/10"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL STOCK ADJUST PANEL */}
      {isStockLogOpen && stockLogProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsStockLogOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <History className="text-orange-500" />
              Ajuste de Movimiento
            </h3>
            <p className="text-xs text-slate-500 mb-3.5">
              Registra una entrada o salida de inventario para <span className="font-bold text-slate-800">{stockLogProduct.name}</span>.
            </p>

            <form onSubmit={handleStockAdjustSubmit} className="space-y-4">
              
              {/* Type toggle selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLogType('In')}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer
                      ${logType === 'In' ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Entrada (Restock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogType('Out')}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer
                      ${logType === 'Out' ? 'bg-red-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Salida (Mermas / Ajuste)
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cantidad ({stockLogProduct.unit}):
                </label>
                <input
                  type="number"
                  placeholder="ej. 12"
                  value={logQuantity}
                  onChange={(e) => setLogQuantity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                  required
                />
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Comentario:
                </label>
                <input
                  type="text"
                  placeholder="ej. Entrada por lote recibido / Rotura de empaque"
                  value={logComment}
                  onChange={(e) => setLogComment(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStockLogOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIGURAR CATEGORÍAS (ADD/EDIT/DELETE LIST) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
                setCategoryName('');
                setCategoryDesc('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Layers className="text-orange-500" />
              Gestor de Categorías
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-sans">
              Crea o edita las categorías de inventario de tu sucursal. Los productos se organizarán de inmediato.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Add form */}
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">
                  {editingCategory ? 'Modificar Categoría' : 'Nueva Categoría'}
                </span>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wilder mb-1">Nombre *</label>
                  <input
                    type="text"
                    placeholder="ej. Cigarrillos"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wilder mb-1">Descripción</label>
                  <textarea
                    placeholder="ej. Tabacos, encendedores y accesorios afines"
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 h-16 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryName('');
                        setCategoryDesc('');
                      }}
                      className="flex-1 py-2 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-xl cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {editingCategory ? 'Aplicar' : 'Agregar'}
                  </button>
                </div>
              </form>

              {/* Active categories list table */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">Categorías Registradas</span>
                
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {categories.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <strong className="text-xs text-slate-800 block truncate font-bold">{c.name}</strong>
                        <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5" title={c.description}>{c.description || 'Sin descripción'}</p>
                      </div>

                      <div className="flex shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(c);
                            setCategoryName(c.name);
                            setCategoryDesc(c.description || '');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded"
                          title="Editar categoría"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Dar de baja la categoría "${c.name}"? Los productos de esta categoría quedarán integrados.`)) {
                              onDeleteCategory(c.id);
                            }
                          }}
                          className="p-1 text-slate-350 hover:text-red-500 rounded"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: IMPORTACIÓN MASIVA DE PRODUCTOS (EXCEL/CSV/JSON) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-import-products-catalog">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => {
                setIsImportModalOpen(false);
                setParsedProducts([]);
                setImportError('');
                setImportSuccess('');
                setImportProgress(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="shrink-0 mb-4">
              <h3 className="text-xl font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                <UploadCloud className="text-blue-600 w-6 h-6" />
                Importar Base de Datos de Productos
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Carga de forma masiva tu catálogo de productos desde otra aplicación o archivo Excel (guardado como CSV) o JSON.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Main content grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Information and guidelines */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Instrucciones de Carga</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Para que la importación sea exitosa, tu archivo debe incluir una fila de encabezados con nombres reconocibles. El sistema mapeará las columnas automáticamente:
                  </p>
                  
                  <ul className="text-xs text-slate-600 space-y-2 font-sans bg-white p-3 rounded-xl border border-slate-150 shadow-xxs">
                    <li>🔹 <strong className="text-slate-900">Nombre_Producto</strong> (Obligatorio)</li>
                    <li>🔹 <strong className="text-slate-900">SKU</strong> o <strong className="text-slate-900">Codigo</strong> (Único por producto)</li>
                    <li>🔹 <strong className="text-slate-900">Codigo_Barras</strong> (Para escáner en POS)</li>
                    <li>🔹 <strong className="text-slate-900">Precio_Venta</strong> y <strong className="text-slate-900">Costo_Unitario</strong></li>
                    <li>🔹 <strong className="text-slate-900">Stock_Actual</strong> y <strong className="text-slate-900">Stock_Minimo</strong></li>
                    <li>🔹 <strong className="text-slate-900">Categoria</strong> y <strong className="text-slate-900">Unidad_Medida</strong></li>
                  </ul>

                  <div className="pt-2">
                    <button
                      onClick={downloadCSVTemplate}
                      className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-blue-150"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      Descargar Plantilla CSV de Ejemplo
                    </button>
                  </div>
                </div>

                {/* Upload drag-drop area */}
                <div className="md:col-span-7 space-y-4">
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50/50' 
                        : parsedProducts.length > 0
                          ? 'border-emerald-400 bg-emerald-50/10'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="file-import-input" 
                      accept=".csv, .json"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    
                    {parsedProducts.length > 0 ? (
                      <>
                        <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                        <h4 className="text-sm font-bold text-slate-800">¡Archivo cargado con éxito!</h4>
                        <p className="text-xs text-slate-500 mt-1 font-sans">
                          Se detectaron <strong className="text-emerald-600">{parsedProducts.length} productos</strong> listos para importar.
                        </p>
                        <button
                          onClick={() => {
                            setParsedProducts([]);
                            setImportError('');
                            setImportSuccess('');
                          }}
                          className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Cargar otro archivo
                        </button>
                      </>
                    ) : (
                      <label htmlFor="file-import-input" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                        <h4 className="text-sm font-bold text-slate-700">Arrastra tu archivo aquí</h4>
                        <p className="text-xs text-slate-400 mt-1.5 font-sans px-4">
                          Soporta archivos <strong className="text-slate-600">.csv</strong> o <strong className="text-slate-600">.json</strong> desde tu computadora. O haz click para seleccionar de tus carpetas.
                        </p>
                        <span className="mt-4 inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm">
                          Seleccionar Archivo
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Feedback Messages */}
                  {importError && (
                    <div className="p-3 bg-red-50 border border-red-150 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Error en interpretación:</strong>
                        <p className="font-sans text-[11px] leading-relaxed mt-0.5">{importError}</p>
                      </div>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-sans font-semibold leading-relaxed">{importSuccess}</p>
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {isImporting && importProgress !== null && (
                    <div className="space-y-1.5 bg-slate-50 border border-slate-150 p-3.5 rounded-xl">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700 font-mono">
                        <span>Guardando en la Nube de Firestore...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${importProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Data Preview Table */}
              {parsedProducts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-150">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vista Previa de Productos ({parsedProducts.length})</h4>
                    <span className="text-[10px] font-mono text-slate-400">Los primeros 5 ítems a continuación</span>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xxs max-h-[180px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-2 border-r border-slate-150">SKU / Código</th>
                          <th className="p-2 border-r border-slate-150">Nombre del Producto</th>
                          <th className="p-2 border-r border-slate-150">Categoría</th>
                          <th className="p-2 border-r border-slate-150 text-right">Costo</th>
                          <th className="p-2 border-r border-slate-150 text-right">Venta</th>
                          <th className="p-2 border-r border-slate-150 text-right">Stock</th>
                          <th className="p-2 text-center">Unidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 bg-white">
                        {parsedProducts.slice(0, 5).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 text-slate-600">
                            <td className="p-2 border-r border-slate-150 font-mono text-slate-900 font-bold">{p.sku}</td>
                            <td className="p-2 border-r border-slate-150 text-slate-900 font-semibold">{p.name}</td>
                            <td className="p-2 border-r border-slate-150">{p.category}</td>
                            <td className="p-2 border-r border-slate-150 text-right font-mono text-slate-500">${p.cost}</td>
                            <td className="p-2 border-r border-slate-150 text-right font-mono text-slate-800 font-bold">${p.price}</td>
                            <td className="p-2 border-r border-slate-150 text-right font-mono text-emerald-600 font-bold">{p.stock}</td>
                            <td className="p-2 text-center text-slate-500">{p.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedProducts.length > 5 && (
                    <p className="text-[10px] text-slate-400 italic text-center">... y {parsedProducts.length - 5} productos más en fila ...</p>
                  )}
                </div>
              )}

            </div>

            <div className="shrink-0 pt-4 border-t border-slate-150 flex justify-end gap-2 bg-white rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedProducts([]);
                  setImportError('');
                  setImportSuccess('');
                  setImportProgress(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                disabled={isImporting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeBulkImport}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                disabled={parsedProducts.length === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Confirmar Importación ({parsedProducts.length} ítems)
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
