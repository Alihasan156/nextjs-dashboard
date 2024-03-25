'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  amount: z.number(),
  date: z.string(),
  status: z.enum(['pending', 'paid']),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  try {
    const { customer_id, amount, status } = CreateInvoice.parse(
      Object.fromEntries(formData.entries()),
    );

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customer_id}, ${amountInCents}, ${status}, ${date})
  `;
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (error) {
    return { message: 'Database Error: Failed to Create Invoice' };
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  try {
    const { customer_id, amount, status } = UpdateInvoice.parse(
      Object.fromEntries(formData.entries()),
    );

    const amountInCents = amount * 100;

    await sql`
      UPDATE invoices
      SET customer_id = ${customer_id}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (error) {
    console.error(error);
    throw new Error('DB Error: Failed to edit error');
  }
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
        DELETE FROM invoices WHERE id = ${id} 
    `;
    revalidatePath('/dashboard/invoices');
    return { message: 'Database Error: Invoice Deleted' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice' };
  }
}
