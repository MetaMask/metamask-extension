import React from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ContactsListPage } from './contacts-list-page';
import { ContactDetailsPage } from './contact-details-page';
import { AddContactPage } from './add-contact-page';
import { EditContactPage } from './edit-contact-page';

export const contactsRoutes: RouteObject[] = [
  { index: true, element: <ContactsListPage /> },
  { path: 'add', element: <AddContactPage /> },
  { path: 'view/:chainId/:address', element: <ContactDetailsPage /> },
  { path: 'edit/:chainId/:address', element: <EditContactPage /> },
  { path: '*', element: <Navigate to="." replace /> },
];
