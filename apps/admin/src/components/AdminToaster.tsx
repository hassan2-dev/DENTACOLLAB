import { Toaster } from 'sonner';
import { useAdminPreferences } from './AdminLayout';

export function AdminToaster() {
  const { language, theme } = useAdminPreferences();
  const isAr = language === 'ar';

  return (
    <Toaster
      position={isAr ? 'top-left' : 'top-right'}
      theme={theme}
      dir={isAr ? 'rtl' : 'ltr'}
      richColors
      closeButton
      expand
      visibleToasts={4}
      gap={10}
      offset={16}
      duration={3200}
      toastOptions={{
        classNames: {
          toast: 'admin-toast',
          title: 'admin-toast-title',
          description: 'admin-toast-desc',
          success: 'admin-toast-success',
          error: 'admin-toast-error',
          info: 'admin-toast-info',
          closeButton: 'admin-toast-close',
        },
      }}
    />
  );
}
