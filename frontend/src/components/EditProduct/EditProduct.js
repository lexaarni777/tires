import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './EditProduct.module.scss';

const warehouseList = [
  { location: 'Москва-1' },
  { location: 'Москва-2' },
  { location: 'Волгоград' },
];

const EditProduct = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Состояния для каталога шин и остатков по складам
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
  });

  const [stocks, setStocks] = useState([]); // Остатки по складам
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Получаем инфу о товаре и остатках по id
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Получаем данные из каталога
        const productRes = await fetch(`http://localhost:5000/api/products/catalog/${id}`);
        if (!productRes.ok) throw new Error('Ошибка при получении товара');
        const productData = await productRes.json();
        setCatalog(productData);

        // Получаем остатки по складам
        const stockRes = await fetch(`http://localhost:5000/api/products/stock?tyre_id=${id}`);
        if (!stockRes.ok) throw new Error('Ошибка при получении остатков');
        const stockData = await stockRes.json();
        setStocks(stockData);

        // Получаем изображения
        const imagesRes = await fetch(`http://localhost:5000/api/products/${id}/images`);
        if (imagesRes.ok) setImages(await imagesRes.json());
        setLoading(false);
      } catch (err) {
        alert('Ошибка загрузки данных: ' + err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Обработка изменений каталога шин
  const handleCatalogChange = (e) => {
    setCatalog({ ...catalog, [e.target.name]: e.target.value });
  };

  // Обработка изменений остатков/цен по складам
  const handleStockChange = (idx, field, value) => {
    setStocks((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  // Сохранить изменения в каталоге
  const handleCatalogSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/products/catalog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(catalog),
      });
      if (res.ok) {
        alert('Информация о товаре обновлена!');
      } else {
        alert('Ошибка обновления товара');
      }
    } catch (err) {
      alert('Ошибка обновления: ' + err.message);
    }
  };

  // Сохранить изменения в остатках по складам
  const handleStockSubmit = async (e, stock, idx) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/products/stock/${stock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price_retail: stock.price_retail,
          price_wholesale: stock.price_wholesale,
          stock: stock.stock,
        }),
      });
      if (res.ok) {
        alert('Остатки на складе обновлены!');
      } else {
        alert('Ошибка обновления остатков');
      }
    } catch (err) {
      alert('Ошибка обновления остатков: ' + err.message);
    }
  };

  // --------- Зона изображений (оставляем как есть) --------
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`http://localhost:5000/api/images/${id}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setImages((prevImages) => [...prevImages, data]);
      }
    } catch (err) {
      alert('Ошибка загрузки изображения: ' + err.message);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/images/${imageId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
        alert('Изображение успешно удалено');
      }
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  // ===== Drag-and-drop реализация =====
const [draggedIndex, setDraggedIndex] = useState(null);

// Начало перетаскивания
const handleDragStart = (index) => {
  setDraggedIndex(index);
};

// Обработка перетаскивания поверх другого элемента
const handleDragOver = (index, e) => {
  e.preventDefault();
  if (draggedIndex === null || draggedIndex === index) return;

  const updatedImages = [...images];
  const [removed] = updatedImages.splice(draggedIndex, 1);
  updatedImages.splice(index, 0, removed);
  setImages(updatedImages);
  setDraggedIndex(index);
};

// Отпускание мыши — сохраняем порядок на сервере
const handleDragEnd = async () => {
  setDraggedIndex(null);
  // Формируем payload для API
  const orderPayload = images.map((img, idx) => ({
    id: img.id,
    order: idx + 1
  }));

  try {
    await fetch(`http://localhost:5000/api/images/${id}/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    // Рефрешим список изображений после обновления порядка
    const imagesRes = await fetch(`http://localhost:5000/api/products/${id}/images`);
    if (imagesRes.ok) setImages(await imagesRes.json());
  } catch (err) {
    alert('Ошибка сохранения порядка: ' + err.message);
  }
};

// Смена главного изображения
const handleSetFeatured = async (imageId) => {
  try {
    await fetch(`http://localhost:5000/api/images/${id}/featured-image`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });
    // После смены главного — рефрешить изображения
    const imagesRes = await fetch(`http://localhost:5000/api/products/${id}/images`);
    if (imagesRes.ok) setImages(await imagesRes.json());
  } catch (err) {
    alert('Ошибка установки главного изображения: ' + err.message);
  }
};

// Получить путь к миниатюре для главного фото
const getThumbPath = (image) => {
  if (!image.is_featured_image) return null;
  const parts = image.image_path.split('.');
  parts[parts.length - 2] += '_thumb';
  return parts.join('.');
};




  if (loading) return <div>Загрузка...</div>;

  return (
    <div className={styles.editProduct}>
      <h1 className={styles.title}>Редактировать товар</h1>

      {/* --- Форма редактирования каталога --- */}
      <form onSubmit={handleCatalogSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Артикул:</label>
          <input type="text" name="article" value={catalog.article} onChange={handleCatalogChange} required />
        </div>
        <div className={styles.formGroup}>
          <label>Название:</label>
          <input type="text" name="name" value={catalog.name} onChange={handleCatalogChange} required />
        </div>
        <div className={styles.formGroup}>
          <label>Бренд:</label>
          <input type="text" name="brand" value={catalog.brand || ''} onChange={handleCatalogChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Модель:</label>
          <input type="text" name="model" value={catalog.model || ''} onChange={handleCatalogChange} />
        </div>
        {/* ... остальные поля по аналогии ... */}
        <div className={styles.formGroup}>
          <label>Описание:</label>
          <textarea name="description" value={catalog.description || ''} onChange={handleCatalogChange} />
        </div>
        <button type="submit" className={styles.saveButton}>
          Сохранить товар
        </button>
      </form>

      {/* --- Форма редактирования остатков по каждому складу --- */}
      <h2>Остатки и цены по складам</h2>
      {stocks.map((stock, idx) => (
        <form key={stock.id} onSubmit={(e) => handleStockSubmit(e, stock, idx)} className={styles.form}>
          <div className={styles.formGroup}>
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
              step="0.01"
              value={stock.price_retail}
              onChange={(e) => handleStockChange(idx, 'price_retail', e.target.value)}
            />
            <label>Оптовая цена:</label>
            <input
              type="number"
              step="0.01"
              value={stock.price_wholesale}
              onChange={(e) => handleStockChange(idx, 'price_wholesale', e.target.value)}
            />
          </div>
          <button type="submit" className={styles.saveButton}>
            Сохранить склад
          </button>
        </form>
      ))}

{/* --- Зона изображений --- */}
<h2>Изображения</h2>
<div
  className={styles.dragDrop}
  onDrop={handleDrop}
  onDragOver={(e) => e.preventDefault()}
>
  <p>Перетащите фотографии сюда для загрузки</p>
</div>
<div className={styles.imageList}>
  {images.map((image, index) => (
    <div
      key={image.id}
      className={styles.imageItem}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={(e) => handleDragOver(index, e)}
      onDragEnd={handleDragEnd}
      style={{
        border: image.is_featured_image ? '2px solid green' : '1px solid #ccc',
        position: 'relative'
      }}
    >
      {/* Показывать миниатюру для главного изображения */}
      {image.is_featured_image ? (
        <img
          src={`http://localhost:5000${getThumbPath(image) || image.image_path}`}
          alt={`Главная миниатюра`}
          className={styles.image}
        />
      ) : (
        <img
          src={`http://localhost:5000${image.image_path}`}
          alt={`Uploaded ${image.id}`}
          className={styles.image}
        />
      )}
      <div style={{ fontSize: 12, marginTop: 2 }}>
        Порядок: {image.order}
      </div>
      {image.is_featured_image && (
        <div
          style={{
            color: 'green',
            fontWeight: 'bold',
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#fff',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 12
          }}
        >
          Главное
        </div>
      )}
      {/* Кнопка сделать главным, если не главное */}
      {!image.is_featured_image && (
        <button
          type="button"
          onClick={() => handleSetFeatured(image.id)}
          style={{
            marginTop: 6,
            fontSize: 12,
            background: '#eee',
            border: '1px solid #ccc'
          }}
        >
          Сделать главным
        </button>
      )}
      <button
        type="button"
        onClick={() => deleteImage(image.id)}
        className={styles.deleteButton}
      >
        Удалить
      </button>
        </div>
      ))}
    </div>


      <button type="button" className={styles.cancelButton} onClick={() => navigate('/')}>
        Отмена
      </button>
    </div>
  );
};

export default EditProduct;
