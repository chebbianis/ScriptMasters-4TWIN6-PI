export const ErrorComponent = ({ message }: { message: string }) => (
    <div className="p-4 bg-red-100 text-red-700 rounded-lg">
      ⚠️ {message}
    </div>
  )