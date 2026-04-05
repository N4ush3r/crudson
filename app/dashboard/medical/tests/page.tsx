"use client";

import { useEffect, useState } from "react";
import {
  getMedicalTests,
  createMedicalTest,
  updateMedicalTest,
  deleteMedicalTest,
  getCategories,
  getUoms,
  MedicalTest,
  TestCategory,
  Uom,
} from "../../actions";
import { Plus, Edit, Trash2, Search, Loader2, Download, Printer } from "lucide-react";

export default function MedicalTestsPage() {
  const [medicalTests, setMedicalTests] = useState<MedicalTest[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<MedicalTest | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    idcategory: "",
    iduom: "",
    normalmin: "",
    normalmax: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tests, categoriesData, uomData] = await Promise.all([getMedicalTests(), getCategories(), getUoms()]);
      setMedicalTests(tests);
      setCategories(categoriesData);
      setUoms(uomData);
    } catch (error) {
      console.error("Failed to load medical tests or lookups", error);
    }
    setLoading(false);
  };

  const handleOpenModal = (test?: MedicalTest) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        name: test.name,
        description: test.description || "",
        idcategory: test.idcategory || "",
        iduom: test.iduom || "",
        normalmin: test.normalmin?.toString() || "",
        normalmax: test.normalmax?.toString() || "",
      });
    } else {
      setEditingTest(null);
      setFormData({
        name: "",
        description: "",
        idcategory: categories[0]?.id || "",
        iduom: uoms[0]?.id || "",
        normalmin: "",
        normalmax: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTest(null);
    setFormData({ name: "", description: "", idcategory: "", iduom: "", normalmin: "", normalmax: "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.idcategory || !formData.iduom) {
      return alert("Please provide the test name, category, and unit.");
    }

    const normalmin = parseFloat(formData.normalmin);
    const normalmax = parseFloat(formData.normalmax);

    if (Number.isNaN(normalmin) || Number.isNaN(normalmax)) {
      return alert("Please provide valid numeric values for min and max.");
    }

    setSaving(true);

    try {
      if (editingTest) {
        await updateMedicalTest({
          id: editingTest.id,
          name: formData.name,
          description: formData.description,
          idcategory: formData.idcategory,
          iduom: formData.iduom,
          normalmin,
          normalmax,
        });
      } else {
        await createMedicalTest({
          name: formData.name,
          description: formData.description,
          idcategory: formData.idcategory,
          iduom: formData.iduom,
          normalmin,
          normalmax,
        });
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save medical test", error);
      alert("Error saving medical test. Ensure the name is unique and required fields are filled.");
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this medical test?")) {
      try {
        await deleteMedicalTest(id);
        await loadData();
      } catch (error) {
        console.error("Failed to delete medical test", error);
        alert("Error deleting medical test.");
      }
    }
  };

  const filteredTests = medicalTests.filter((test) =>
    test.name.toLowerCase().includes(search.toLowerCase()) ||
    test.category_name?.toLowerCase().includes(search.toLowerCase()) ||
    test.uom_name?.toLowerCase().includes(search.toLowerCase()) ||
    (test.description && test.description.toLowerCase().includes(search.toLowerCase()))
  );

  const exportToExcel = async () => {
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Medical Tests");

      sheet.columns = [
        { header: "Test Name", key: "name", width: 30 },
        { header: "Category", key: "category", width: 20 },
        { header: "Unit", key: "unit", width: 18 },
        { header: "Min", key: "min", width: 12 },
        { header: "Max", key: "max", width: 12 },
        { header: "Description", key: "description", width: 40 },
      ];

      medicalTests.forEach((test) => {
        sheet.addRow({
          name: test.name,
          category: test.category_name || "",
          unit: test.uom_name || "",
          min: test.normalmin ?? "",
          max: test.normalmax ?? "",
          description: test.description || "",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "medical-tests.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export to Excel", error);
      alert("Unable to export to Excel. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm;
          }

          body {
            background: #fff;
            color: #000;
          }

          .no-print {
            display: none !important;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #d1d5db;
            padding: 8px;
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Medical Tests</h1>
          <p className="text-gray-500 text-sm mt-1">Manage medical tests with categories and UOMs. Export to Excel or print as PDF.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Plus size={18} /> New Test
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Download size={18} /> Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Printer size={18} /> Print PDF
          </button>
        </div>
      </div>

      <div className="relative mb-6 no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search tests, categories or units..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm text-gray-600 print-table">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Test Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Unit</th>
              <th className="px-6 py-4">Min</th>
              <th className="px-6 py-4">Max</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={24} />
                  <span className="text-gray-500">Loading medical tests...</span>
                </td>
              </tr>
            ) : filteredTests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No medical tests found.</td>
              </tr>
            ) : (
              filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{test.name}</td>
                  <td className="px-6 py-4">{test.category_name || "-"}</td>
                  <td className="px-6 py-4">{test.uom_name || "-"}</td>
                  <td className="px-6 py-4">{test.normalmin ?? "-"}</td>
                  <td className="px-6 py-4">{test.normalmax ?? "-"}</td>
                  <td className="px-6 py-4">{test.description || "-"}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap no-print">
                    <button onClick={() => handleOpenModal(test)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors inline-flex" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(test.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors inline-flex ml-1" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editingTest ? "Edit Medical Test" : "Add Medical Test"}</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 grid gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Fasting Blood Glucose"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.idcategory}
                  onChange={(e) => setFormData({ ...formData, idcategory: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Choose category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit *</label>
                <select
                  required
                  value={formData.iduom}
                  onChange={(e) => setFormData({ ...formData, iduom: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Choose unit</option>
                  {uoms.map((uom) => (
                    <option key={uom.id} value={uom.id}>{uom.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Normal Min</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.normalmin}
                    onChange={(e) => setFormData({ ...formData, normalmin: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Normal Max</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.normalmax}
                    onChange={(e) => setFormData({ ...formData, normalmax: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 99"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Optional details..."
                />
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
