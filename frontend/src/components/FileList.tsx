import React from 'react';
import { GridColDef, DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';

interface File {
  id: string;
  filename: string;
  upload_date: string;
  uploaded_by: string;
}

interface FileListProps {
  files: File[];
  onDownload: (id: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onDownload }) => {
  const columns: GridColDef[] = [
    { field: 'filename', headerName: 'Filename' },
    { field: 'upload_date', headerName: 'Upload Date' },
    { field: 'uploaded_by', headerName: 'Uploaded By' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => onDownload(params.row.id)}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <DataGrid columns={columns} rows={files} />
  );
};

export default FileList;