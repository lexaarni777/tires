import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { addProduct, uploadProductsFromExcel } from '../../slices/productSlice';
import styles from './AddProduct.module.css';

const AddProduct = () => {
  const [id, setid] = useState('');
  const [name, setname] = useState('');
  const [price_opt_vlg, setprice_opt_vlg] = useState('');
  const [price_opt_msk, setprice_opt_msk] = useState('');
  const [stock_vlg, setstock_vlg] = useState('');
  const [stock_msk1, setstock_msk1] = useState('');
  const [stock_msk2, setstock_msk2] = useState('');
  const [retail_vlg, setretail_vlg] = useState('');
  const [retail_msk, setretail_msk] = useState('');
  const [images, setImages] = useState([]); // Хранение изображений
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();


  const user = useSelector((state) => state.auth.user);
  const roles = useSelector((state) => state.auth.roles);
  (console.log(user, roles))

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const productData = {
        id,
        name,
        price_opt_vlg: parseFloat(price_opt_vlg),
        price_opt_msk: parseFloat(price_opt_msk),
        stock_vlg: parseInt(stock_vlg),
        stock_msk1: parseInt(stock_msk1),
        stock_msk2: parseInt(stock_msk2),
        retail_vlg: parseFloat(retail_vlg),
        retail_msk: parseFloat(retail_msk),
      };

      await dispatch(addProduct(productData)); // Сохраняем товар
      setSuccess(true);

      // Сбрасываем поля
      setid('');
      setname('');
      setprice_opt_vlg('');
      setprice_opt_msk('');
      setstock_vlg('');
      setstock_msk1('');
      setstock_msk2('');
      setretail_vlg('');
      setretail_msk('');
      setImages([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setImages((prevImages) => [...prevImages, ...files]); // Добавляем изображения в состояние
  };

  const uploadImages = async () => {
    for (const file of images) {
      const formData = new FormData();
      formData.append('image', file);
      console.log(id)

      try {
        const response = await fetch(`http://localhost:5000/api/images/${id}/upload-image`, {
          method: 'POST',
          body: formData,
        });
        console.log(response)

        if (!response.ok) {
          console.error('Ошибка при загрузке изображения');
        }
      } catch (err) {
        console.error('Ошибка при загрузке:', err);
      }
    }
  };

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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className={styles.container}>
      <h2>Добавить товар вручную</h2>
      <form onSubmit={handleManualSubmit}>
        <div className={styles.formGroup}>
          <label>ID:</label>
          <input
            type="number"
            value={id}
            onChange={(e) => setid(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Название:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setname(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Цена опт Волгоград:</label>
          <input
            type="number"
            step="0.01"
            value={price_opt_vlg}
            onChange={(e) => setprice_opt_vlg(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Цена опт Москва:</label>
          <input
            type="number"
            step="0.01"
            value={price_opt_msk}
            onChange={(e) => setprice_opt_msk(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Склад Волгоград:</label>
          <input
            type="number"
            value={stock_vlg}
            onChange={(e) => setstock_vlg(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Склад Москва 1:</label>
          <input
            type="number"
            value={stock_msk1}
            onChange={(e) => setstock_msk1(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Склад Москва 2:</label>
          <input
            type="number"
            value={stock_msk2}
            onChange={(e) => setstock_msk2(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Розничная цена Волгоград:</label>
          <input
            type="number"
            step="0.01"
            value={retail_vlg}
            onChange={(e) => setretail_vlg(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Розничная цена Москва:</label>
          <input
            type="number"
            step="0.01"
            value={retail_msk}
            onChange={(e) => setretail_msk(e.target.value)}
            required
          />
        </div>
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
        </div>
        <button type="submit" onClick={uploadImages}>
          Добавить вручную
        </button>
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
        <button type="submit">Загрузить из Excel</button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>Операция выполнена успешно!</p>}
    </div>
  );
};

export default AddProduct;