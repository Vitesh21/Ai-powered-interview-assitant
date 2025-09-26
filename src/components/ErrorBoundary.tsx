import React from 'react';
import { Result, Button } from 'antd';

interface State { hasError: boolean; }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // Optionally log error to a monitoring service
    console.error('App crashed:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="An unexpected error occurred. Please try reloading the app."
          extra={<Button type="primary" onClick={this.handleReload}>Reload</Button>}
        />
      );
    }
    return this.props.children;
  }
}
