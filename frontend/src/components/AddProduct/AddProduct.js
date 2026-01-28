'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addProduct, addStock, uploadProductsFromExcel } from '../../slices/productSlice';
import styles from './AddProduct.module.scss';
import Button from '../ui/Button';
import { warehouseList } from '../../constants/warehouseList';

/**
 * AddProduct — компонент для добавления новой шины вручную
 * и для массовой загрузки каталога из Excel.
 */

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';

const AddProduct = () => {
  // Состояние для справочника шин (tyre_catalog)
  const [catalog, setCatalog] = useState({
    article: '',
    name: '',
    brand: '',
    model: '',
    size: '',
    load_index: '',
    speed_index: '',
    season: '',
    vehicle_type: '',
    tread_depth: '',
    section_width: '',
    recommended_rim_width: '',
    diameter: '',
    country: '',
    description: '',
    studs: '',   
    profile: '', 
  });

  // Остатки и цены по складам (tyre_stock)
  const [stocks, setStocks] = useState(
    warehouseList.map((wh) => ({
      location: wh.location,
      stock: '',
      price_retail: '',
      price_wholesale: '',
    }))
  );

  const [images, setImages] = useState([]); // Изображения
  const [file, setFile] = useState(null); // Excel-файл
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch();
  const [useAsReference, setUseAsReference] = useState(false);

  // Получаем пользователя (если нужно для проверки прав)
  const user = useSelector((state) => state.auth.user);
  const roles = useSelector((state) => state.auth.roles);

  /**
   * Обработка изменения поля справочника шин
   */
  const handleCatalogChange = (e) => {
    setCatalog({ ...catalog, [e.target.name]: e.target.value });
  };

  /**
   * Обработка изменения остатков/цен по складам
   */
  const handleStockChange = (idx, field, value) => {
    setStocks((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  /**
   * Перетаскивание файлов изображений
   */
  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setImages((prevImages) => [...prevImages, ...files]);
  };

  /**
   * Обработка выбора Excel-файла
   */
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  /**
   * Загрузка изображений для товара
   * (вызывается после успешного создания товара)
   */
const uploadImages = async (productId, brand, model) => {
  for (const file of images) {
    const formData = new FormData();
    formData.append('image', file);

    const url = useAsReference
      ? `${apiBase()}/images/model/${brand}/${model}`
      : `${apiBase()}/images/${productId}/upload-image`;

    await fetch(url, {
      method: 'POST',
      body: formData,
    });
  }
};

  /**
   * Добавить новый товар вручную (tyre_catalog + tyre_stock)
   */
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      // 1. Добавляем товар в справочник (tyre_catalog)
      const createdProduct = await dispatch(addProduct(catalog)).unwrap();

      // 2. Добавляем остатки и цены по каждому складу
      const productId = createdProduct.id;
      for (const stock of stocks) {
        if (
          stock.stock !== '' ||
          stock.price_retail !== '' ||
          stock.price_wholesale !== ''
        ) {
          await dispatch(
            addStock({
              tyre_id: productId,
              location: stock.location,
              stock: parseInt(stock.stock, 10) || 0,
              price_retail: parseFloat(stock.price_retail) || 0,
              price_wholesale: parseFloat(stock.price_wholesale) || 0,
            })
          );
        }
      }

      // 3. Загружаем фотографии (если есть)
      if (images.length > 0) {
        await uploadImages(productId, catalog.brand, catalog.model);
      }

      setSuccess(true);

      // Сбросить формы
      setCatalog({
        article: '',
        name: '',
        brand: '',
        model: '',
        size: '',
        load_index: '',
        speed_index: '',
        season: '',
        vehicle_type: '',
        tread_depth: '',
        section_width: '',
        recommended_rim_width: '',
        diameter: '',
        country: '',
        description: '',
        studs: '',
        profile: ''
      });
      setStocks(
        warehouseList.map((wh) => ({
          location: wh.location,
          stock: '',
          price_retail: '',
          price_wholesale: '',
        }))
      );
      setImages([]);
    } catch (err) {
      setError(err.message || 'Ошибка при добавлении товара 1');
    }
  };

  /**
   * Загрузка каталога из Excel (batch upload)
   */
  const handleExcelSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (file) {
      try {
        await dispatch(uploadProductsFromExcel(file));
        setSuccess(true);
        setFile(null);
      } catch (err) {
        setError(err.message);
      }
    } else {
      setError('Пожалуйста, выберите файл для загрузки.');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Добавить новую шину вручную</h2>
      <form onSubmit={handleManualSubmit}>
        {/* Все поля справочника шин (tyre_catalog) */}
        <div className={styles.formGroup}>
          <label>Артикул:</label>
          <input
            type="text"
            name="article"
            value={catalog.article}
            onChange={handleCatalogChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Название:</label>
          <input
            type="text"
            name="name"
            value={catalog.name}
            onChange={handleCatalogChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Бренд:</label>
          <input
            type="text"
            name="brand"
            value={catalog.brand}
            onChange={handleCatalogChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Модель:</label>
          <input
            type="text"
            name="model"
            value={catalog.model}
            onChange={handleCatalogChange}
          />
        </div>
        {/* ... остальные поля аналогично ... */}
        <div className={styles.formGroup}>
          <label>Описание:</label>
          <textarea
            name="description"
            value={catalog.description}
            onChange={handleCatalogChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Профиль:</label>
          <input
            type="number"
            name="profile"
            value={catalog.profile}
            onChange={handleCatalogChange}
          />
        </div>
        <div className={styles.formGroup}>
        <label>Шипы:</label>
        <select
          name="studs"
          value={catalog.studs}
          onChange={handleCatalogChange}
        >
          <option value="">Не указано</option>
          <option value="true">Есть шипы</option>
          <option value="false">Без шипов</option>
        </select>
      </div>



        <h3>Остатки и цены по складам</h3>
        {stocks.map((stock, idx) => (
          <div key={idx} className={styles.formGroup}>
            <strong>{stock.location}</strong>
            <label>Остаток:</label>
            <input
              type="number"
              value={stock.stock}
              onChange={(e) => handleStockChange(idx, 'stock', e.target.value)}
            />
            <label>Розничная цена:</label>
            <input
              type="number"
              value={stock.price_retail}
              step="0.01"
              onChange={(e) => handleStockChange(idx, 'price_retail', e.target.value)}
            />
            <label>Оптовая цена:</label>
            <input
              type="number"
              value={stock.price_wholesale}
              step="0.01"
              onChange={(e) => handleStockChange(idx, 'price_wholesale', e.target.value)}
            />
          </div>
        ))}

        <div className={styles.formGroup}>
          <label>Перетащите фотографии сюда:</label>
          <div
            className={styles.dragDrop}
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <p>Перетащите файлы сюда для загрузки</p>
          </div>
          <div className={styles.imagePreview}>
            {images.map((file, index) => (
              <div key={index} className={styles.imageItem}>
                <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} />
              </div>
            ))}
          </div>
          <input
            type="checkbox"
            checked={useAsReference}
            onChange={(e) => setUseAsReference(e.target.checked)}
          /> Использовать как эталонное фото
        </div>
        <Button variant="primary" type="submit">Добавить вручную</Button>
      </form>

      <h2>Загрузить товары из Excel</h2>
      <form onSubmit={handleExcelSubmit}>
        <div className={styles.formGroup}>
          <label>Загрузить Excel файл:</label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
        </div>
        <Button variant="primary" type="submit">Загрузить из Excel</Button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>Операция выполнена успешно!</p>}
    </div>
  );
};

export default AddProduct;
