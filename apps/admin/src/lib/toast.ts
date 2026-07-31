import { toast } from 'sonner';

export const notify = {
  success(message: string, description?: string) {
    toast.success(message, { description, duration: 2800 });
  },
  error(message: string, description?: string) {
    toast.error(message, { description, duration: 4200 });
  },
  info(message: string, description?: string) {
    toast.message(message, { description, duration: 3000 });
  },
};
