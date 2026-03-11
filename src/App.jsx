import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image as ImageIcon, Download, Plus } from 'lucide-react';

function App() {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [minSize, setMinSize] = useState(0); // in MB
  const [maxSize, setMaxSize] = useState(10); // in MB
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    setError(null);
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const sizeMB = file.size / (1024 * 1024);
      const isWithinSize = sizeMB >= minSize && sizeMB <= maxSize;
      
      if (isImage && !isWithinSize) {
        setError(`Some files were skipped (limits: ${minSize}MB - ${maxSize}MB)`);
      }
      
      return isImage && isWithinSize;
    });
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          url: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
  };

  const convertToPdf = async () => {
    const pdf = new jsPDF();
    
    for (let i = 0; i < images.length; i++) {
      if (i > 0) pdf.addPage();
      
      const img = images[i];
      const imgProps = pdf.getImageProperties(img.url);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(img.url, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    pdf.save('converted_images.pdf');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel"
    >
      <header>
        <div className="flex justify-center mb-4">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <FileText size={48} className="floating-icon" />
          </motion.div>
        </div>
        <h1 className="title-gradient">Image to PDF</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Premium, private, and lightning fast. No uploads needed.
        </p>
      </header>

      <div className="settings-panel">
        <div className="input-group">
          <label>Min File Size (MB)</label>
          <input 
            type="number" 
            min="0" 
            step="0.1" 
            value={minSize} 
            onChange={(e) => setMinSize(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="input-group">
          <label>Max File Size (MB)</label>
          <input 
            type="number" 
            min="0" 
            step="0.1" 
            value={maxSize} 
            onChange={(e) => setMaxSize(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div 
        className={`drop-zone ${isDragging ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          hidden 
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload size={32} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
        <p style={{ fontWeight: 500 }}>Drop your images here or click to browse</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Supports JPG, PNG, WebP within {minSize}-{maxSize}MB
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="alert-toast"
          >
            <ImageIcon size={16} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="preview-grid">
              {images.map((img) => (
                <motion.div 
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="preview-card"
                >
                  <img src={img.url} alt={img.name} />
                  <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}>
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="stats">
              <span>{images.length} {images.length === 1 ? 'image' : 'images'} selected</span>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="action-btn"
              onClick={convertToPdf}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Download size={20} />
                Generate PDF
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {images.length === 0 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
           <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>🔒</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>100% Private</p>
           </div>
           <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>⚡</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ultra Fast</p>
           </div>
           <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>✨</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pure Visuals</p>
           </div>
        </div>
      )}
    </motion.div>
  );
}

export default App;
