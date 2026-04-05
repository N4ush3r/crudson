"use client";

import { useState, useEffect } from "react";
import { getUoms, createUom, updateUom, deleteUom, Uom } from "./actions";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";

export default function UomPage() {
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<Uom | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUoms();
      setUoms(data);
    } catch (error) {
      console.error("Failed to load UOMs", error);
    }
    setLoading(false);
  };

  const handleOpenModal = (uom?: Uom) => {
    if (uom) {
      setEditingUom(uom);
      setFormData({ name: uom.name, description: uom.description || "" });
    } else {
      setEditingUom(null);
      setFormData({ name: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUom(null);
    setFormData({ name: "", description: "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setSaving(true);
    
    try {
      if (editingUom) {
        await updateUom({ id: editingUom.id, name: formData.name, description: formData.description });
      } else {
        await createUom({ name: formData.name, description: formData.description });
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save UOM", error);
      alert("Error saving Unit of Measurement. Ensure the name is unique.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this Unit of Measurement?")) {
      try {
        await deleteUom(id);
        await loadData();
      } catch (error) {
        console.error("Failed to delete UOM", error);
        alert("Error deleting Unit of Measurement. It might be in use by a medical test.");
      }
    }
  };

  const filteredUoms = uoms.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.description && u.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Units of Measurement</h1>
          <p className="text-gray-500 text-sm mt-1">Manage measurement units used across medical tests.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
        >
          <Plus size={18} /> Add Unit
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search units..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4 w-1/2">Description</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={24} />
                  <span className="text-gray-500">Loading data...</span>
                </td>
              </tr>
            ) : filteredUoms.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No units of measurement found.</td>
              </tr>
            ) : (
              filteredUoms.map((uom) => (
                <tr key={uom.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{uom.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{uom.name}</td>
                  <td className="px-6 py-4">{uom.description || "-"}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button onClick={() => handleOpenModal(uom)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors inline-flex" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(uom.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors inline-flex ml-1" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editingUom ? "Edit Unit" : "Add Unit"}</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                <input type="text" required maxLength={15} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. mg/dL" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Optional details..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}