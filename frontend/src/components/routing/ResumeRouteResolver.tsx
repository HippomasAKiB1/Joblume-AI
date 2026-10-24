import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeViewAPI } from '../../services/apiV2';
import ResumeBuilderPage from '../../pages/dashboard/ResumeBuilderPage';

export const ResumeRouteResolver: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLegacy, setIsLegacy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/dashboard/resumes', { replace: true });
      return;
    }

    let isMounted = true;

    async function probeRoute() {
      try {
        await resumeViewAPI.get(id!);
        // If 200 OK -> V2 resume view exists!
        if (isMounted) {
          navigate(`/dashboard/resumes/${id}`, { replace: true });
        }
      } catch (err: any) {
        if (!isMounted) return;
        const status = err.response?.status;
        if (status === 404) {
          // ID not found in V2 -> Fall back cleanly to legacy ResumeBuilderPage
          setIsLegacy(true);
        } else {
          setError(err.response?.data?.detail || 'Unable to resolve resume route.');
        }
      }
    }

    probeRoute();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (error) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard/resumes')}
        >
          Return to Resume Library
        </button>
      </div>
    );
  }

  if (isLegacy) {
    // Render legacy editor seamlessly for legacy resume bookmarks
    return <ResumeBuilderPage />;
  }

  // Probe in flight
  return (
    <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div className="spinner spinner-lg" />
      <p style={{ color: 'var(--text-secondary)' }}>Resolving resume editor...</p>
    </div>
  );
};

export default ResumeRouteResolver;
