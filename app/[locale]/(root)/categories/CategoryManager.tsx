'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Pencil, Trash2, Merge, X } from 'lucide-react';
import {
  renameCategory,
  deleteCategory,
  mergeCategories,
  approveCategory,
  getAllCategoriesAdmin,
} from '@/lib/actions/category.actions';

type CategoryItem = {
  _id: string;
  name: string;
  type: string;
  approved: boolean;
  usageCount: number;
};

type Props = {
  initialCategories: CategoryItem[];
  userId: string;
};

export default function CategoryManager({ initialCategories, userId }: Props) {
  const t = useTranslations('catManage');
  const tc = useTranslations('common');

  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return categories.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter === 'approved' && !c.approved) return false;
      if (statusFilter === 'pending' && c.approved) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [categories, search, typeFilter, statusFilter]);

  const refresh = async () => {
    const fresh = await getAllCategoriesAdmin(userId);
    if (fresh) setCategories(fresh);
  };

  const handleApprove = async (id: string) => {
    setLoading(id);
    await approveCategory(userId, id);
    await refresh();
    setLoading(null);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    setLoading(id);
    await renameCategory(userId, id, editName);
    setEditingId(null);
    setEditName('');
    await refresh();
    setLoading(null);
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(t('confirmDelete', { name: cat.name }))) return;
    setLoading(cat._id);
    await deleteCategory(userId, cat._id);
    await refresh();
    setLoading(null);
  };

  const handleMerge = async (source: CategoryItem) => {
    if (!mergeTargetId) return;
    const target = categories.find((c) => c._id === mergeTargetId);
    if (!target) return;
    if (!confirm(t('confirmMerge', { source: source.name, target: target.name }))) return;
    setLoading(source._id);
    await mergeCategories(userId, source._id, mergeTargetId);
    setMergingId(null);
    setMergeTargetId('');
    await refresh();
    setLoading(null);
  };

  const pendingCount = categories.filter((c) => !c.approved).length;

  const typeButtons = [
    { value: 'all', label: t('all') },
    { value: 'fandom', label: t('fandom') },
    { value: 'itemType', label: t('itemType') },
  ];

  const statusButtons = [
    { value: 'all', label: t('all') },
    { value: 'pending', label: `${t('pending')} (${pendingCount})` },
    { value: 'approved', label: t('approved') },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="h2-bold">{t('title')}</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1">
          {typeButtons.map((b) => (
            <button
              key={b.value}
              onClick={() => setTypeFilter(b.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === b.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-grey-50 dark:bg-muted text-grey-500 dark:text-grey-300'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {statusButtons.map((b) => (
            <button
              key={b.value}
              onClick={() => setStatusFilter(b.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === b.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-grey-50 dark:bg-muted text-grey-500 dark:text-grey-300'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t('total', { count: filtered.length })}</p>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">{t('noTags')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-2 font-medium">{t('name')}</th>
                <th className="py-2 px-2 font-medium">{t('type')}</th>
                <th className="py-2 px-2 font-medium text-center">{t('usage')}</th>
                <th className="py-2 px-2 font-medium text-center">{t('status')}</th>
                <th className="py-2 px-2 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat) => (
                <tr
                  key={cat._id}
                  className={`border-b hover:bg-grey-50 dark:hover:bg-muted/50 ${
                    !cat.approved ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                  }`}
                >
                  {/* Name */}
                  <td className="py-2 px-2">
                    {editingId === cat._id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-48"
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(cat._id)}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleRename(cat._id)} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{cat.name}</span>
                    )}
                  </td>

                  {/* Type */}
                  <td className="py-2 px-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      cat.type === 'fandom'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}>
                      {cat.type === 'fandom' ? t('fandom') : t('itemType')}
                    </span>
                  </td>

                  {/* Usage count */}
                  <td className="py-2 px-2 text-center">{cat.usageCount}</td>

                  {/* Status */}
                  <td className="py-2 px-2 text-center">
                    {cat.approved ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        {t('approved')}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                        {t('pending')}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {!cat.approved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(cat._id)}
                          disabled={loading === cat._id}
                          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          title={t('approve')}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {t('approve')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(cat._id);
                          setEditName(cat.name);
                          setMergingId(null);
                        }}
                        disabled={loading === cat._id}
                        className="h-7 px-2"
                        title={t('rename')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {/* Merge */}
                      {mergingId === cat._id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={mergeTargetId}
                            onChange={(e) => setMergeTargetId(e.target.value)}
                            className="h-7 text-xs rounded border px-1 bg-background"
                          >
                            <option value="">{t('selectTarget')}</option>
                            {categories
                              .filter((c) => c._id !== cat._id && c.type === cat.type)
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMerge(cat)}
                            disabled={!mergeTargetId || loading === cat._id}
                            className="h-7 px-2"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setMergingId(null)} className="h-7 px-2">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMergingId(cat._id);
                            setMergeTargetId('');
                            setEditingId(null);
                          }}
                          disabled={loading === cat._id}
                          className="h-7 px-2"
                          title={t('mergeInto')}
                        >
                          <Merge className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(cat)}
                        disabled={loading === cat._id}
                        className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title={tc('delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
