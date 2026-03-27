import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { DialProvider } from '@dial-wtf/react';
import { ContactsListPage } from './contacts-list-page';
import { ContactDetailsPage } from './contact-details-page';
import { AddContactPage } from './add-contact-page';
import { EditContactPage } from './edit-contact-page';

const DIAL_API_KEY = process.env.DIAL_API_KEY;

function ContactsLayout() {
  return (
    <DialProvider
      apiKey={DIAL_API_KEY}
      network="alpha"
      debug={process.env.NODE_ENV === 'development'}
    >
      <Outlet />
    </DialProvider>
  );
}

export const contactsRoutes: RouteObject[] = [
  {
    element: <ContactsLayout />,
    children: [
      { index: true, element: <ContactsListPage /> },
      { path: 'add', element: <AddContactPage /> },
      { path: 'view/:chainId/:address', element: <ContactDetailsPage /> },
      { path: 'edit/:chainId/:address', element: <EditContactPage /> },
      { path: '*', element: <Navigate to="." replace /> },
    ],
  },
];
