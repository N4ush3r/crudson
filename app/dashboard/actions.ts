"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

// =========================================
// UOM (Units of Measure) Actions
// =========================================
export interface Uom {
  id: string; // BIGINT is returned as a string by node-postgres to preserve precision
  name: string;
  description: string | null;
}

export async function getUoms(): Promise<Uom[]> {
  const { rows } = await query<Uom>("SELECT * FROM uom ORDER BY id DESC");
  return rows;
}

export async function createUom(data: Omit<Uom, "id">) {
  await query("INSERT INTO uom (name, description) VALUES ($1, $2)", [data.name, data.description || null]);
  revalidatePath("/dashboard/medical/uom");
  revalidatePath("/dashboard/medical/tests");
}

export async function updateUom(data: Uom) {
  await query("UPDATE uom SET name = $1, description = $2 WHERE id = $3", [data.name, data.description || null, data.id]);
  revalidatePath("/dashboard/medical/uom");
  revalidatePath("/dashboard/medical/tests");
}

export async function deleteUom(id: string) {
  await query("DELETE FROM uom WHERE id = $1", [id]);
  revalidatePath("/dashboard/medical/uom");
  revalidatePath("/dashboard/medical/tests");
}

// =========================================
// Test Categories Actions
// =========================================
export interface TestCategory {
  id: string;
  name: string;
  description: string | null;
}

export async function getCategories(): Promise<TestCategory[]> {
  const { rows } = await query<TestCategory>("SELECT * FROM testcategories ORDER BY id DESC");
  return rows;
}

export async function createCategory(data: Omit<TestCategory, "id">) {
  await query("INSERT INTO testcategories (name, description) VALUES ($1, $2)", [data.name, data.description || null]);
  revalidatePath("/dashboard/medical/categories");
  revalidatePath("/dashboard/medical/tests");
}

export async function updateCategory(data: TestCategory) {
  await query("UPDATE testcategories SET name = $1, description = $2 WHERE id = $3", [data.name, data.description || null, data.id]);
  revalidatePath("/dashboard/medical/categories");
  revalidatePath("/dashboard/medical/tests");
}

export async function deleteCategory(id: string) {
  await query("DELETE FROM testcategories WHERE id = $1", [id]);
  revalidatePath("/dashboard/medical/categories");
  revalidatePath("/dashboard/medical/tests");
}

// =========================================
// Medical Tests Actions
// =========================================
export interface MedicalTest {
  id: string;
  name: string;
  description: string | null;
  iduom: string | null;
  idcategory: string | null;
  normalmin: number | null;
  normalmax: number | null;
  uom_name?: string; // Derived from JOIN
  category_name?: string; // Derived from JOIN
}

export async function getMedicalTests(): Promise<MedicalTest[]> {
  const { rows } = await query<MedicalTest>(`
    SELECT m.*, u.name as uom_name, c.name as category_name 
    FROM medicaltests m
    LEFT JOIN uom u ON m.iduom = u.id
    LEFT JOIN testcategories c ON m.idcategory = c.id
    ORDER BY m.id DESC
  `);
  return rows;
}

export async function createMedicalTest(data: Omit<MedicalTest, "id" | "uom_name" | "category_name">) {
  await query(
    "INSERT INTO medicaltests (name, description, iduom, idcategory, normalmin, normalmax) VALUES ($1, $2, $3, $4, $5, $6)",
    [data.name, data.description || null, data.iduom || null, data.idcategory || null, data.normalmin, data.normalmax]
  );
  revalidatePath("/dashboard/medical/tests");
}

export async function updateMedicalTest(data: Omit<MedicalTest, "uom_name" | "category_name">) {
  await query(
    "UPDATE medicaltests SET name = $1, description = $2, iduom = $3, idcategory = $4, normalmin = $5, normalmax = $6 WHERE id = $7",
    [data.name, data.description || null, data.iduom || null, data.idcategory || null, data.normalmin, data.normalmax, data.id]
  );
  revalidatePath("/dashboard/medical/tests");
}

export async function deleteMedicalTest(id: string) {
  await query("DELETE FROM medicaltests WHERE id = $1", [id]);
  revalidatePath("/dashboard/medical/tests");
}