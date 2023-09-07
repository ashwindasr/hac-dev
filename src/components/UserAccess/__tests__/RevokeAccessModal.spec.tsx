import * as React from 'react';
import '@testing-library/jest-dom';
import { k8sDeleteResource } from '@openshift/dynamic-plugin-sdk-utils';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SpaceBindingRequest } from '../../../types';
import { RevokeAccessModal } from '../RevokeAccessModal';

jest.mock('@openshift/dynamic-plugin-sdk-utils', () => ({
  k8sDeleteResource: jest.fn(),
}));

const mockSBR: SpaceBindingRequest = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'SpaceBindingRequest',
  metadata: {
    name: 'test-sbr',
  },
  spec: {
    masterUserRecord: 'test-user',
    spaceRole: 'contributor',
  },
  status: {
    conditions: [
      {
        reason: 'Provisioned',
        status: 'True',
      },
    ],
  },
};

const k8sDeleteMock = k8sDeleteResource as jest.Mock;

describe('RevokeAccessModal', () => {
  it('should render revoke modal', () => {
    render(<RevokeAccessModal sbr={mockSBR} modalProps={{ isOpen: true }} />);
    expect(screen.getByTestId('description').textContent).toBe(
      'The user test-user will lose access to this workspace and all of its applications, environments, and any other dependent items.',
    );
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  it('should delete resource & close modal when revoked', async () => {
    const onClose = jest.fn();
    k8sDeleteMock.mockResolvedValue({});
    render(<RevokeAccessModal sbr={mockSBR} onClose={onClose} modalProps={{ isOpen: true }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    await waitFor(() => expect(k8sDeleteMock).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('should show error and not close modal if deletion fails', async () => {
    const onClose = jest.fn();
    k8sDeleteMock.mockRejectedValue(new Error('Unable to delete'));
    render(<RevokeAccessModal sbr={mockSBR} onClose={onClose} modalProps={{ isOpen: true }} />);
    fireEvent.click(screen.getByText('Revoke'));
    await waitFor(() => expect(screen.getByText('Unable to delete')).toBeVisible());
  });
});
