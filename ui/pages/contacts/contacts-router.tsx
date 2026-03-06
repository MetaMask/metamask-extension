import React from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ContactsListPage } from './contacts-list-page';
import { ContactDetailsPage } from './contact-details-page';
import { AddContactPage } from './add-contact-page';
import { EditContactPage } from './edit-contact-page';

/**
 * Route objects for the contacts section.
 * Used as `children` of the parent contacts RouteObject.
 */
export const contactsRoutes: RouteObject[] = [
  { index: true, element: <ContactsListPage /> },
  { path: 'add', element: <AddContactPage /> },
  { path: 'view/:address', element: <ContactDetailsPage /> },
  { path: 'edit/:address', element: <EditContactPage /> },
  { path: '*', element: <Navigate to="." replace /> },
];
