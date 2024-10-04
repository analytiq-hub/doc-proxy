"use client";

import React, { useState, ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from "next-auth/react";
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Box, Button } from '@mui/material';
import { Menu as MenuIcon, Upload as UploadIcon, List as ListIcon, ExitToApp as LogoutIcon, Dashboard as DashboardIcon, Login as LoginIcon, Science as ScienceIcon, AccountTree as AccountTreeIcon } from '@mui/icons-material';
//import SignIn from "@/components/SignIn"

interface LayoutProps {
  children: ReactNode;
}

function AuthButton() {
  const { data: session } = useSession();

  const buttonStyle = {
    color: 'inherit',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  };

  if (session) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body1" sx={{ mr: 2 }}>
          {session?.user?.name}
        </Typography>
        <Button sx={buttonStyle} onClick={() => signOut()}>Sign out</Button>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography variant="body1" sx={{ mr: 2 }}>
      </Typography>
      <Button sx={buttonStyle} onClick={() => signIn()}>Sign in</Button>
    </Box>
  );
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);
 // const { data: session, status } = useSession();
 const status = "authenticated";
  const router = useRouter();

  // useEffect(() => {
  //   console.log('Session status:', status);
  //   console.log('Session data:', session);
  //   if (status === 'unauthenticated') {
  //     router.push('/login');
  //   }
  // }, [session, status, router]);

  useEffect(() => {
      router.push('/login');
  }, [router]);


  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    //signOut();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
    { text: 'Upload', icon: <UploadIcon />, href: '/upload' },
    { text: 'List Files', icon: <ListIcon />, href: '/listFiles' },
    { text: 'Workflows', icon: <AccountTreeIcon />, href: '/workflows' },
    { text: 'Test', icon: <ScienceIcon />, href: '/test' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#2c3e50' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Doc Proxy
          </Typography>
          {status === 'authenticated' ? (
            <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" component={Link} href="/login" startIcon={<LoginIcon />}>
              Login
            </Button>
          )}
          <AuthButton />
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            backgroundColor: '#34495e',
            color: 'white',
          },
        }}
      >
        <Toolbar />
        <List>
          {status === 'authenticated' && menuItems.map((item) => (
            <ListItem
              key={item.text}
              component={Link}
              href={item.href}
              sx={{ 
                textDecoration: 'none', 
                color: 'inherit',
                '&:hover': {
                  backgroundColor: '#2c3e50',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;