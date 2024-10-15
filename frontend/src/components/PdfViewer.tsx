// components/PDFViewer.js
"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { downloadFileApi } from '@/utils/api';
import { Toolbar, Typography, IconButton, TextField } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type PDFState = {
  file: string | null;
  loading: boolean;
  error: string | null;
};

const initializePDF = async (id: string): Promise<PDFState> => {
  try {
    const response = await downloadFileApi(id);
    const blob = new Blob([response], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(blob);
    return { file: fileURL, loading: false, error: null };
  } catch (error) {
    console.error('Error fetching PDF for id:', id, error);
    return { file: null, loading: false, error: 'Failed to load PDF. Please try again.' };
  }
};

const PDFViewer = ({ id }: { id: string }) => {
  const [{ file, loading, error }, setPDFState] = useState<PDFState>(() => ({
    file: null,
    loading: true,
    error: null,
  }));
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<string | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useState(() => {
    initializePDF(id).then(newState => {
      setPDFState(newState);
      if (newState.file) {
        fileRef.current = newState.file;
      }
    });
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    if (fileRef.current) {
      URL.revokeObjectURL(fileRef.current);
      fileRef.current = null;
    }
    setPDFState(prev => ({ ...prev, file: null }));
  }, []);

  // Use effect for cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [inputPageNumber, setInputPageNumber] = useState('1');

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    
    // Get the first page to calculate dimensions
    pdfjs.getDocument(file!).promise.then((pdf) => {
      pdf.getPage(1).then((page) => {
        const viewport = page.getViewport({ scale: 1 });
        setPdfDimensions({ width: viewport.width, height: viewport.height });
      });
    });
  };

  const handleLoadError = (error: { message: string }) => {
    setPDFState(prev => ({ ...prev, error: error.message }));
    console.error('PDF Load Error:', error);
  };

  const goToNextPage = () => {
    if (pageNumber < numPages!) {
      const newPageNumber = pageNumber + 1;
      setPageNumber(newPageNumber);
      setInputPageNumber(newPageNumber.toString());
    }
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      const newPageNumber = pageNumber - 1;
      setPageNumber(newPageNumber);
      setInputPageNumber(newPageNumber.toString());
    }
  };

  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.25, 3));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
  const rotateLeft = () => setRotation(prevRotation => (prevRotation - 90) % 360);
  const rotateRight = () => setRotation(prevRotation => (prevRotation + 90) % 360);

  // New useEffect to handle auto-zoom
  useEffect(() => {
    if (pdfDimensions.width && pdfDimensions.height && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const widthScale = containerWidth / pdfDimensions.width;
      const heightScale = containerHeight / pdfDimensions.height;

      // Use the smaller scale to ensure the entire page fits
      // Increase the scaling factor to make the initial display larger
      const optimalScale = Math.min(widthScale, heightScale) * 0.95; // Increased from 0.9 to 0.95

      // Add a minimum scale to ensure the PDF isn't too small
      const adjustedScale = Math.max(optimalScale, 1.0); // Ensure scale is at least 1.0

      setScale(adjustedScale);
    }
  }, [pdfDimensions]);

  const handlePageNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputPageNumber(event.target.value);
  };

  const handlePageNumberSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newPageNumber = parseInt(inputPageNumber, 10);
    if (newPageNumber >= 1 && newPageNumber <= (numPages || 0)) {
      setPageNumber(newPageNumber);
    } else {
      // Reset input to current page number if invalid
      setInputPageNumber(pageNumber.toString());
    }
  };

  return (
    <div>
      <Toolbar sx={{ backgroundColor: theme => theme.palette.accent.main }}>
        <IconButton onClick={goToPrevPage} disabled={pageNumber <= 1} color="inherit">
          <ArrowBackIosNewIcon />
        </IconButton>
        <IconButton onClick={goToNextPage} disabled={pageNumber >= (numPages || 0)} color="inherit">
          <ArrowForwardIosIcon />
        </IconButton>
        <form onSubmit={handlePageNumberSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ mx: 1, color: theme => theme.palette.accent.contrastText }}>
            Page
          </Typography>
          <TextField
            value={inputPageNumber}
            onChange={handlePageNumberChange}
            onBlur={() => setInputPageNumber(pageNumber.toString())}
            type="number"
            size="small"
            slotProps={{
              input: {
                inputProps: {
                  min: 1,
                  max: numPages || 1,
                  style: { textAlign: 'center' }
                }
              }
            }}
            sx={{ 
              mx: 1,
              width: '60px',
              '& input': {
                appearance: 'textfield',
                '-moz-appearance': 'textfield',
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                  '-webkit-appearance': 'none',
                  margin: 0,
                },
              }
            }}
          />
          <Typography variant="body1" sx={{ mx: 1, color: theme => theme.palette.accent.contrastText }}>
            of {numPages}
          </Typography>
        </form>
        <IconButton onClick={zoomOut} color="inherit">
          <ZoomOutIcon />
        </IconButton>
        <IconButton onClick={zoomIn} color="inherit">
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={rotateLeft} color="inherit">
          <RotateLeftIcon />
        </IconButton>
        <IconButton onClick={rotateRight} color="inherit">
          <RotateRightIcon />
        </IconButton>
      </Toolbar>
      <div 
        ref={containerRef} 
        style={{ overflowY: 'scroll', height: '80vh', padding: '16px' }}
      >
        {loading ? (
          <div>Loading PDF...</div>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : file ? (
          <Document
            file={file}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div 
                key={`page_container_${index + 1}`}
                ref={el => pageRefs.current[index] = el}
              >
                <Page 
                  key={`page_${index + 1}`} 
                  pageNumber={index + 1} 
                  width={pdfDimensions.width * scale}
                  height={pdfDimensions.height * scale}
                  rotate={rotation}
                />
                {index < numPages! - 1 && <hr style={{ border: '2px solid black' }} />}
              </div>
            ))}
          </Document>
        ) : (
          <Typography color="error" align="center">
            No PDF file available.
          </Typography>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
