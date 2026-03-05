import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CONTACTS_ROUTE } from '../../helpers/constants/routes';
import { ContactsListPage } from './contacts-list-page';
import { ContactDetailsPage } from './contact-details-page';
import { AddContactPage } from './add-contact-page';
import { EditContactPage } from './edit-contact-page';

export function ContactsRouter() {
  return (
    <Routes>
      <Route index element={<ContactsListPage />} />
      <Route path="add" element={<AddContactPage />} />
      <Route path="view/:address" element={<ContactDetailsPage />} />
      <Route path="edit/:address" element={<EditContactPage />} />
      <Route path="*" element={<Navigate to={CONTACTS_ROUTE} replace />} />
    </Routes>
  );
}
