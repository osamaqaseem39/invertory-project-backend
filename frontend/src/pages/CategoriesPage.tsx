import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../i18n/i18nContext';
import { Category, UserRole } from '../types';
import { inventoryAPI } from '../api/inventory';

export const CategoriesPage = () => {
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
  });

  const canManage = user?.role === UserRole.OWNER_ULTIMATE_SUPER_ADMIN || user?.role === UserRole.ADMIN;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryAPI.listCategories();
      setCategories(data.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', parent_id: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        parent_id: formData.parent_id || undefined,
      };

      if (editingCategory) {
        await inventoryAPI.updateCategory(editingCategory.id, data);
        alert('✅ Category updated successfully!');
      } else {
        await inventoryAPI.createCategory(data);
        alert('✅ Category created successfully!');
      }

      setShowModal(false);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;

    try {
      await inventoryAPI.deleteCategory(id);
      alert('✅ Category deleted successfully!');
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete category');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">{t.categories.categories}</h1>
            <p className="text-slate-600 text-sm">Organize your products into categories</p>
          </div>
          {canManage && (
            <button onClick={() => handleOpenModal()} className="btn-primary">
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.categories.addCategory}
            </button>
          )}
        </div>

        {/* Categories Table */}
        <div className="glass rounded-3xl overflow-hidden shadow-xl animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">No categories found</p>
              {canManage && (
                <button onClick={() => handleOpenModal()} className="btn-primary">
                  Create First Category
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Parent</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Products</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Status</th>
                  {canManage && <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category.id} className="border-t border-slate-100 hover:bg-primary-50/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{category.description || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{category.parent?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg font-semibold text-sm">
                        {category._count?.products || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg font-semibold text-xs ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(category)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="glass rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {editingCategory ? t.categories.editCategory : t.categories.addCategory}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input-field"
                  placeholder="e.g., Electronics"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder={language === 'ar' ? 'وصف اختياري...' : 'Optional description...'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.common.parent}</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">{language === 'ar' ? 'لا يوجد (المستوى الأعلى)' : 'None (Top Level)'}</option>
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingCategory ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إنشاء' : 'Create')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

