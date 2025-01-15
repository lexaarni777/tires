import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './EditProduct.module.css'; // Импортируем стили

const EditProduct = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const product = location.state?.product || {
    name: '',
    price_opt_vlg: '',
    price_opt_msk: '',
    stock_vlg: '',
    stock_msk1: '',
    stock_msk2: '',
    retail_vlg: '',
    retail_msk: '',
  };

  const [formData, setFormData] = useState(product);
  const [images, setImages] = useState([]); // Состояние для изображений

  // Загружаем изображения при загрузке компонента
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}/images`);
        console.log('response', response)
        if (response.ok) {
          const data = await response.json();
          setImages(data); // Устанавливаем загруженные изображения
        } else {
          console.error('Ошибка при загрузке изображений');
        }
      } catch (err) {
        console.error('Ошибка при запросе:', err);
      }
    };

    fetchImages();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

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
        console.log('ID товара:', id);
        console.log('Файлы для загрузки:', images);
      const response = await fetch(`http://localhost:5000/api/images/${id}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setImages((prevImages) => [...prevImages, data]); // Добавляем новое изображение
      } else {
        console.error('Ошибка загрузки изображения');
      }
    } catch (err) {
      console.error('Ошибка при загрузке:', err);
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
      } else {
        console.error('Ошибка при удалении изображения');
      }
    } catch (err) {
      console.error('Ошибка при удалении:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Товар успешно обновлен!');
        navigate('/');
      } else {
        alert('Ошибка при обновлении товара!');
      }
    } catch (err) {
      console.error('Ошибка при обновлении:', err);
    }
  };

  return (
    <div className={styles.editProduct}>
      <h1 className={styles.title}>Редактировать товар</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Название:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Цена опт (Влг):</label>
          <input
            type="number"
            name="price_opt_vlg"
            value={formData.price_opt_vlg}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Цена опт (Мск):</label>
          <input
            type="number"
            name="price_opt_msk"
            value={formData.price_opt_msk}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Наличие (Влг):</label>
          <input
            type="number"
            name="stock_vlg"
            value={formData.stock_vlg}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Наличие (Мск1):</label>
          <input
            type="number"
            name="stock_msk1"
            value={formData.stock_msk1}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Наличие (Мск2):</label>
          <input
            type="number"
            name="stock_msk2"
            value={formData.stock_msk2}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Розница (Влг):</label>
          <input
            type="number"
            name="retail_vlg"
            value={formData.retail_vlg}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Розница (Мск):</label>
          <input
            type="number"
            name="retail_msk"
            value={formData.retail_msk}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
    {/* Зона для загрузки изображений */}
        <div  className={styles.dragDrop} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          <p>Перетащите фотографии сюда для загрузки</p>
        </div>

        {/* Отображение миниатюр изображений */}
        <div className={styles.imageList}>
          {images.map((image) => (
            
            <div key={image.id} className={styles.imageItem}>
                {console.log(image)}
              <img
                src={`http://localhost:5000${image.image_path}`}
                alt={`Uploaded ${image.id}`}
                className={styles.image}
              />
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

        <div className={styles.actions}>
          <button type="submit" className={styles.saveButton}>
            Сохранить
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate('/')}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;