'use client';

import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { Button, Field, Input, Modal, Textarea } from '@/components/ui';

const EMPTY = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function SupplierFormModal({ open, onClose, supplier, onSubmit }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValues(
      supplier
        ? {
            name: supplier.name || '',
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            notes: supplier.notes || '',
          }
        : EMPTY
    );
    setErrors({});
    setFormError('');
  }, [open, supplier]);

  const update = (key) => (event) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onSubmit(values);
    if (!result?.ok) {
      setErrors(result?.errors || {});
      setFormError(result?.error || 'Unable to save the supplier.');
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Building2}
      title={supplier ? `Edit ${supplier.name}` : 'Add supplier'}
      description="Supplier records are demonstration data stored locally in this browser."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="supplier-form" icon={Save}>
            {supplier ? 'Save changes' : 'Save supplier'}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && Object.keys(errors).length === 0 ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {formError}
          </p>
        ) : null}

        <Field label="Supplier name" htmlFor="supplier-name" required error={errors.name}>
          <Input
            id="supplier-name"
            value={values.name}
            onChange={update('name')}
            placeholder="Northwind Office Supplies"
            invalid={Boolean(errors.name)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact person" htmlFor="supplier-contact" required error={errors.contactPerson}>
            <Input
              id="supplier-contact"
              value={values.contactPerson}
              onChange={update('contactPerson')}
              placeholder="Maria Santos"
              invalid={Boolean(errors.contactPerson)}
            />
          </Field>
          <Field label="Phone" htmlFor="supplier-phone" required error={errors.phone}>
            <Input
              id="supplier-phone"
              value={values.phone}
              onChange={update('phone')}
              placeholder="+63 917 555 0142"
              invalid={Boolean(errors.phone)}
            />
          </Field>
        </div>

        <Field label="Email" htmlFor="supplier-email" error={errors.email}>
          <Input
            id="supplier-email"
            type="email"
            value={values.email}
            onChange={update('email')}
            placeholder="sales@supplier-demo.ph"
            invalid={Boolean(errors.email)}
          />
        </Field>

        <Field label="Address" htmlFor="supplier-address" error={errors.address}>
          <Textarea
            id="supplier-address"
            value={values.address}
            onChange={update('address')}
            placeholder="Street, city, province"
          />
        </Field>

        <Field label="Notes" htmlFor="supplier-notes" hint="Optional demonstration notes.">
          <Input
            id="supplier-notes"
            value={values.notes}
            onChange={update('notes')}
            placeholder="Lead time, delivery schedule…"
          />
        </Field>
      </form>
    </Modal>
  );
}
