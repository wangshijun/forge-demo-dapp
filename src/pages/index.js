/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState } from 'react';
import styled from 'styled-components';

import Button from '@material-ui/core/Button';
import DidAuth from '@arcblock/did-react/lib/Auth';

import Layout from '../components/layout';
import api from '../libs/api';

export default function IndexPage() {
  const [open, setOpen] = useState(false);
  return (
    <Layout title="Home">
      <Main>
        <Button color="secondary" variant="contained" size="large" onClick={() => setOpen(true)}>
          I am feeling lucky
        </Button>
        {open && (
          <DidAuth
            responsive
            action="lucky"
            checkFn={api.get}
            onClose={() => setOpen(false)}
            onSuccess={() => window.location.reload()}
            messages={{
              title: 'Get random token for FREE',
              scan: 'Scan qrcode to get random token for FREE',
              confirm: 'Confirm on your ABT Wallet',
              success: 'random token sent to your account',
            }}
          />
        )}
      </Main>
    </Layout>
  );
}

const Main = styled.main`
  margin: 80px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
`;
