import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback, useEffect } from 'react';
import { Address, Abi } from 'viem';

interface UseContractReadOptions {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  enabled?: boolean;
  watch?: boolean;
}

interface UseContractWriteOptions {
  address: Address;
  abi: Abi;
}

/**
 * Enhanced hook for reading contract data with error handling and loading states
 */
export function useContractRead<T = unknown>(options: UseContractReadOptions) {
  const {
    data,
    error,
    isError,
    isLoading,
    refetch,
  } = useReadContract({
    address: options.address,
    abi: options.abi,
    functionName: options.functionName,
    args: options.args,
    query: {
      enabled: options.enabled !== false,
      refetchInterval: options.watch ? 10000 : false, // Refetch every 10 seconds if watching
    },
  });

  return {
    data: data as T,
    error,
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Enhanced hook for writing to contracts with transaction management
 */
export function useContractWrite(options: UseContractWriteOptions) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();

  const {
    data: receipt,
    error: confirmError,
    isLoading: isReceiptLoading,
    isSuccess: isReceiptSuccess,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Update states when transaction states change
  useEffect(() => {
    if (hash) {
      setTransactionHash(hash);
      setIsConfirming(true);
      setIsSuccess(false);
    }
  }, [hash]);

  useEffect(() => {
    if (isReceiptSuccess) {
      setIsConfirming(false);
      setIsSuccess(true);
    }
  }, [isReceiptSuccess]);

  useEffect(() => {
    if (confirmError) {
      setIsConfirming(false);
      setIsSuccess(false);
    }
  }, [confirmError]);

  const write = useCallback(
    (functionName: string, args?: readonly unknown[]) => {
      setIsSuccess(false);
      setTransactionHash(null);
      
      writeContract({
        address: options.address,
        abi: options.abi,
        functionName,
        args,
      });
    },
    [writeContract, options.address, options.abi]
  );

  const reset = useCallback(() => {
    setIsConfirming(false);
    setIsSuccess(false);
    setTransactionHash(null);
  }, []);

  return {
    write,
    reset,
    hash: transactionHash,
    receipt,
    error: writeError || confirmError,
    isPending: isWritePending,
    isConfirming: isConfirming || isReceiptLoading,
    isSuccess,
  };
}

/**
 * Hook for batch reading multiple contract values
 */
export function useMultipleContractRead<T extends Record<string, any>>(
  contracts: Array<{
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
    key: keyof T;
  }>
) {
  const [data, setData] = useState<Partial<T>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  const results = contracts.map(contract => 
    useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: contract.functionName,
      args: contract.args,
    })
  );

  useEffect(() => {
    const newData: Partial<T> = {};
    const newErrors: Record<string, Error> = {};
    let loading = false;

    contracts.forEach((contract, index) => {
      const result = results[index];
      
      if (result.isLoading) {
        loading = true;
      } else if (result.error) {
        newErrors[contract.key as string] = result.error;
      } else if (result.data !== undefined) {
        newData[contract.key] = result.data as any;
      }
    });

    setData(newData);
    setErrors(newErrors);
    setIsLoading(loading);
  }, [results, contracts]);

  const refetchAll = useCallback(() => {
    results.forEach(result => result.refetch());
  }, [results]);

  return {
    data,
    errors,
    isLoading,
    refetchAll,
  };
}

/**
 * Hook for managing allowances with approval functionality
 */
export function useTokenAllowance(
  tokenAddress: Address,
  tokenAbi: Abi,
  owner: Address | undefined,
  spender: Address
) {
  const { data: allowance, refetch: refetchAllowance } = useContractRead<bigint>({
    address: tokenAddress,
    abi: tokenAbi,
    functionName: 'allowance',
    args: owner ? [owner, spender] : undefined,
    enabled: !!owner,
    watch: true,
  });

  const { write: writeApprove, ...approveState } = useContractWrite({
    address: tokenAddress,
    abi: tokenAbi,
  });

  const approve = useCallback(
    (amount: bigint) => {
      writeApprove('approve', [spender, amount]);
    },
    [writeApprove, spender]
  );

  const needsApproval = useCallback(
    (amount: bigint) => {
      return !allowance || allowance < amount;
    },
    [allowance]
  );

  return {
    allowance: allowance || 0n,
    approve,
    needsApproval,
    refetchAllowance,
    ...approveState,
  };
}

/**
 * Hook for managing contract events
 */
export function useContractEvents(
  address: Address,
  abi: Abi,
  eventName: string,
  fromBlock?: bigint
) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // In a real implementation, you would use a proper event listening mechanism
  // This is a simplified version for demonstration
  useEffect(() => {
    // Placeholder for event listening logic
    // In practice, you would use wagmi's event hooks or a similar mechanism
    setIsLoading(false);
  }, [address, abi, eventName, fromBlock]);

  return {
    events,
    isLoading,
    error,
  };
}
